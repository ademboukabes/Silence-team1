"""
Operator Analytics Agent

Business Analyst agent for operator performance analysis and forecasting.
Provides actionable insights based on real backend data.

REAL-ONLY MODE: Requires backend endpoints to be available.
"""

import logging
from typing import Dict, Any
from datetime import datetime, timedelta

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class OperatorAnalyticsAgent(BaseAgent):
    """
    Operator Analytics Agent - Business Analyst for port operators.
    
    Analyzes:
    - Operator decision patterns
    - Capacity utilization
    - Monthly throughput forecasts
    
    Provides:
    - Management score (0-100)
    - Planning quality assessment (GOOD/RISK/CRITICAL)
    - Actionable recommendations
    """
    
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute operator analytics analysis.
        
        Context requirements:
            - operator_id: str (from entities or query params)
            - terminal: Optional[str]
            - range_days: int (default 30)
            - bucket: str (default "1h")
            - use_llm: bool (default True)
            - user_role: str (must be OPERATOR or ADMIN)
            - auth_header: str (for backend calls)
        
        Returns:
            {
                "message": str,
                "data": {
                    "operator_id": str,
                    "operator_management_score": int,
                    "planning_quality": str,
                    "patterns": [...],
                    "suggestions": [...],
                    ...
                },
                "proofs": {...}
            }
        """
        trace_id = self.get_trace_id(context)
        user_role = self.get_user_role(context)
        auth_header = self.get_auth_header(context)
        
        logger.info(f"[{trace_id[:8]}] OperatorAnalyticsAgent executing")
        
        # RBAC Check
        if user_role not in ("OPERATOR", "ADMIN"):
            return self.error_response(
                message="Access denied. Operator analytics is only available to OPERATOR and ADMIN roles.",
                trace_id=trace_id,
                error_type="RBACViolation",
                required_role="OPERATOR or ADMIN",
                current_role=user_role
            )
        
        # Extract parameters
        entities = self.get_entities(context)
        operator_id = context.get("operator_id") or entities.get("operator_id")
        terminal = context.get("terminal") or entities.get("terminal")
        range_days = context.get("range_days", 30)
        bucket = context.get("bucket", "1h")
        use_llm = context.get("use_llm", True)
        
        if not operator_id:
            return self.validation_error(
                message="Missing required parameter: operator_id",
                suggestion="Please provide operator_id in the request",
                missing_field="operator_id",
                example="operator_id=OP123",
                trace_id=trace_id
            )
        
        # Calculate date range
        from app.tools.time_tool import today_iso
        date_to = today_iso()
        date_from_dt = datetime.now() - timedelta(days=range_days)
        date_from = date_from_dt.strftime("%Y-%m-%d")
        
        logger.info(f"[{trace_id[:8]}] Analyzing operator {operator_id} from {date_from} to {date_to}")
        
        # Fetch backend data (REAL-ONLY)
        try:
            backend_data = await self._fetch_backend_data(
                operator_id=operator_id,
                terminal=terminal,
                date_from=date_from,
                date_to=date_to,
                bucket=bucket,
                auth_header=auth_header,
                trace_id=trace_id
            )
        except Exception as e:
            # Backend dependency missing
            from app.tools.analytics_data_client import BackendDependencyMissing
            if isinstance(e, BackendDependencyMissing):
                return self.error_response(
                    message=f"Backend data unavailable: {str(e)}",
                    trace_id=trace_id,
                    error_type="BackendDependencyMissing",
                    details=str(e),
                    required_endpoints=[
                        "GET /analytics/operators/{id}/actions",
                        "GET /analytics/plan/slots",
                        "GET /analytics/ops/throughput"
                    ]
                )
            else:
                logger.exception(f"[{trace_id[:8]}] Unexpected error fetching backend data")
                return self.error_response(
                    message="Failed to fetch analytics data from backend",
                    trace_id=trace_id,
                    error_type=type(e).__name__,
                    details=str(e)
                )
        
        # Run analytics
        try:
            analytics_result = await self._run_analytics(backend_data, trace_id)
        except Exception as e:
            logger.exception(f"[{trace_id[:8]}] Analytics computation failed")
            return self.error_response(
                message="Analytics computation failed",
                trace_id=trace_id,
                error_type=type(e).__name__,
                details=str(e)
            )
        
        # Calculate BA score
        ba_score = self._calculate_ba_score(analytics_result)
        
        # Determine planning quality
        planning_quality = self._determine_planning_quality(ba_score, analytics_result)
        
        # AGNO polishing (optional)
        if use_llm:
            try:
                from app.agno_runtime.operator_analytics_polish import agno_polish_overview
                
                polish_context = {
                    "operator_id": operator_id,
                    "terminal": terminal or "ALL"
                }
                
                polished = await agno_polish_overview(analytics_result, polish_context)
                analytics_result["executive_summary"] = polished.get("executive_summary")
                analytics_result["key_findings"] = polished.get("key_findings")
                analytics_result["risk_level"] = polished.get("risk_level")
            except Exception as e:
                logger.warning(f"[{trace_id[:8]}] AGNO polishing failed: {e}")
                # Continue without polishing
        
        # Build response
        data = {
            "operator_id": operator_id,
            "terminal": terminal,
            "month_analyzed": date_to[:7],  # YYYY-MM
            "operator_management_score": ba_score,
            "planning_quality": planning_quality,
            **analytics_result
        }
        
        # Generate message
        if planning_quality == "GOOD":
            message = f"Operator {operator_id} shows strong performance (score: {ba_score}/100). Operations are well-aligned with capacity planning."
        elif planning_quality == "RISK":
            message = f"Operator {operator_id} shows moderate risk (score: {ba_score}/100). Review recommendations to optimize capacity utilization."
        else:  # CRITICAL
            message = f"Operator {operator_id} requires immediate attention (score: {ba_score}/100). Critical capacity and decision-making issues detected."
        
        return self.success_response(
            message=message,
            data=data,
            trace_id=trace_id,
            data_sources=["analytics/operators/actions", "analytics/plan/slots", "analytics/ops/throughput"],
            methods=["behavior_analysis", "capacity_analysis", "ba_scoring"],
            mode="real"
        )
    
    async def _fetch_backend_data(
        self,
        operator_id: str,
        terminal: str,
        date_from: str,
        date_to: str,
        bucket: str,
        auth_header: str,
        trace_id: str
    ) -> Dict[str, Any]:
        """
        Fetch all required data from backend (REAL-ONLY).
        
        Raises:
            BackendDependencyMissing: If any endpoint is unavailable
        """
        from app.tools.analytics_data_client import (
            get_operator_actions,
            get_plan_slots,
            get_ops_throughput,
            get_ops_bookings
        )
        
        # Fetch operator actions
        actions = await get_operator_actions(
            operator_id=operator_id,
            date_from=date_from,
            date_to=date_to,
            auth_header=auth_header,
            trace_id=trace_id
        )
        
        # Fetch plan slots
        plan = await get_plan_slots(
            terminal=terminal,
            date_from=date_from,
            date_to=date_to,
            auth_header=auth_header,
            trace_id=trace_id,
            bucket=bucket
        )
        
        # Fetch throughput
        throughput = await get_ops_throughput(
            terminal=terminal,
            date_from=date_from,
            date_to=date_to,
            auth_header=auth_header,
            trace_id=trace_id,
            bucket=bucket
        )
        
        # Fetch bookings (optional, for additional context)
        try:
            bookings = await get_ops_bookings(
                terminal=terminal,
                date_from=date_from,
                date_to=date_to,
                auth_header=auth_header,
                trace_id=trace_id
            )
        except:
            bookings = {}
        
        return {
            "actions": actions,
            "plan": plan,
            "throughput": throughput,
            "bookings": bookings
        }
    
    async def _run_analytics(
        self,
        backend_data: Dict[str, Any],
        trace_id: str
    ) -> Dict[str, Any]:
        """
        Run all analytics computations.
        """
        from app.analytics import (
            analyze_operator_behavior,
            analyze_capacity_utilization
        )
        
        actions = backend_data["actions"]
        plan = backend_data["plan"]
        throughput = backend_data["throughput"]
        
        # Behavior analysis
        behavior_result = analyze_operator_behavior(actions, throughput, plan)
        
        # Capacity analysis
        capacity_result = analyze_capacity_utilization(plan, throughput)
        
        # Combine results
        return {
            "patterns": behavior_result["patterns"],
            "suggestions": behavior_result["suggestions"],
            "decision_stats": behavior_result["decision_stats"],
            "data_quality_notes": behavior_result["data_quality_notes"],
            "overall_utilization": capacity_result["overall_utilization"],
            "under_utilized_slots": capacity_result["under_utilized_slots"],
            "over_saturated_slots": capacity_result["over_saturated_slots"],
            "capacity_recommendations": capacity_result["capacity_recommendations"],
            "utilization_by_hour": capacity_result["utilization_by_hour"]
        }
    
    def _calculate_ba_score(self, analytics_result: Dict[str, Any]) -> int:
        """
        Calculate Business Analyst management score (0-100).
        
        Factors:
        - Decision quality (accept/reject rates)
        - Capacity utilization
        - Pattern severity
        - Data quality
        """
        score = 100
        
        # Factor 1: Decision quality (30 points)
        decision_stats = analytics_result.get("decision_stats", {})
        accept_rate = decision_stats.get("accept_rate", 0.5)
        reject_rate = decision_stats.get("reject_rate", 0.5)
        
        # Ideal accept rate: 60-75%
        if 0.60 <= accept_rate <= 0.75:
            decision_score = 30
        elif 0.50 <= accept_rate <= 0.85:
            decision_score = 20
        else:
            decision_score = 10
        
        score = decision_score
        
        # Factor 2: Capacity utilization (40 points)
        utilization = analytics_result.get("overall_utilization", 0.0)
        
        # Ideal utilization: 70-85%
        if 0.70 <= utilization <= 0.85:
            utilization_score = 40
        elif 0.60 <= utilization <= 0.90:
            utilization_score = 30
        elif 0.50 <= utilization <= 0.95:
            utilization_score = 20
        else:
            utilization_score = 10
        
        score += utilization_score
        
        # Factor 3: Pattern severity (20 points)
        patterns = analytics_result.get("patterns", [])
        if patterns:
            avg_severity = sum(p.get("severity", 0) for p in patterns) / len(patterns)
            pattern_score = int(20 * (1 - avg_severity))  # Lower severity = higher score
        else:
            pattern_score = 20  # No patterns = good
        
        score += pattern_score
        
        # Factor 4: Data quality (10 points)
        data_quality_notes = analytics_result.get("data_quality_notes", [])
        if not data_quality_notes:
            data_quality_score = 10
        elif len(data_quality_notes) == 1:
            data_quality_score = 7
        else:
            data_quality_score = 5
        
        score += data_quality_score
        
        # Clamp to 0-100
        return max(0, min(100, score))
    
    def _determine_planning_quality(
        self,
        ba_score: int,
        analytics_result: Dict[str, Any]
    ) -> str:
        """
        Determine planning quality: GOOD / RISK / CRITICAL
        """
        if ba_score >= 75:
            return "GOOD"
        elif ba_score >= 50:
            return "RISK"
        else:
            return "CRITICAL"
