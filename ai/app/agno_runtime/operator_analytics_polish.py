"""
AGNO Operator Analytics Polish

Uses AGNO LLM to polish raw analytics data into executive summary.
Provides fallback to deterministic text if AGNO fails or is unavailable.

Functions:
- agno_polish_overview: Polish analytics into BA-grade narrative
"""

import os
import logging
import json
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Configuration
AGNO_PROVIDER = os.getenv("AGNO_PROVIDER", "google")
AGNO_MODEL = os.getenv("AGNO_MODEL", "gemini-1.5-flash")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


async def agno_polish_overview(
    analytics_data: Dict[str, Any],
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Polish raw analytics data into executive summary using AGNO.
    
    Args:
        analytics_data: Raw analytics output with:
            - operator_management_score
            - planning_quality
            - patterns
            - suggestions
            - forecast (optional)
        context: Additional context (operator_id, terminal, etc.)
    
    Returns:
        {
            "executive_summary": str,
            "key_findings": List[str],
            "recommendations": List[str],
            "risk_level": str (LOW/MEDIUM/HIGH/CRITICAL)
        }
        
        Falls back to deterministic text if AGNO fails.
    """
    logger.info("Polishing analytics with AGNO")
    
    # Try AGNO if API key available
    if GOOGLE_API_KEY and AGNO_PROVIDER == "google":
        try:
            result = await _agno_google_polish(analytics_data, context)
            if result:
                logger.info("AGNO polishing successful")
                return result
        except Exception as e:
            logger.warning(f"AGNO polishing failed: {e}, falling back to deterministic")
    
    # Fallback to deterministic
    logger.info("Using deterministic polishing (AGNO unavailable)")
    return _deterministic_polish(analytics_data, context)


async def _agno_google_polish(
    analytics_data: Dict[str, Any],
    context: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Use Google Gemini via AGNO to polish analytics.
    """
    try:
        import google.generativeai as genai
        
        # Configure API
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(AGNO_MODEL)
        
        # Build prompt
        prompt = _build_polish_prompt(analytics_data, context)
        
        # Generate
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 1000
            }
        )
        
        # Parse JSON response
        text = response.text.strip()
        
        # Extract JSON from markdown code blocks if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(text)
        
        # Validate structure
        required_keys = ["executive_summary", "key_findings", "recommendations", "risk_level"]
        if all(k in result for k in required_keys):
            return result
        else:
            logger.warning(f"AGNO response missing required keys: {result.keys()}")
            return None
            
    except ImportError:
        logger.warning("google-generativeai not installed, skipping AGNO")
        return None
    except json.JSONDecodeError as e:
        logger.warning(f"AGNO returned invalid JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"AGNO error: {e}")
        return None


def _build_polish_prompt(
    analytics_data: Dict[str, Any],
    context: Dict[str, Any]
) -> str:
    """
    Build prompt for AGNO polishing.
    """
    score = analytics_data.get("operator_management_score", 0)
    quality = analytics_data.get("planning_quality", "UNKNOWN")
    patterns = analytics_data.get("patterns", [])
    suggestions = analytics_data.get("suggestions", [])
    forecast = analytics_data.get("forecast", {})
    
    operator_id = context.get("operator_id", "UNKNOWN")
    terminal = context.get("terminal", "ALL")
    
    # Format patterns
    patterns_text = "\n".join([
        f"- {p.get('title', 'N/A')}: {p.get('evidence', 'N/A')} (severity: {p.get('severity', 0):.2f})"
        for p in patterns[:5]
    ]) if patterns else "No significant patterns detected"
    
    # Format suggestions
    suggestions_text = "\n".join([
        f"- {s.get('title', 'N/A')}: {s.get('why', 'N/A')}"
        for s in suggestions[:5]
    ]) if suggestions else "No recommendations at this time"
    
    # Forecast summary
    if forecast:
        forecast_text = f"""
Forecast for next month:
- Total trucks: {forecast.get('forecast_total_trucks', 0)}
- High-risk slots: {forecast.get('expected_congested_slots_count', 0)}
- Avg delay: {forecast.get('expected_avg_delay', 0):.1f} min
- Alignment score: {forecast.get('month_alignment_score', 0)}/100
"""
    else:
        forecast_text = ""
    
    prompt = f"""You are a senior Business Analyst for a smart port. Analyze the following operator performance data and provide an executive summary.

**Operator**: {operator_id}
**Terminal**: {terminal}
**Management Score**: {score}/100
**Planning Quality**: {quality}

**Detected Patterns**:
{patterns_text}

**Recommendations**:
{suggestions_text}

{forecast_text}

Generate a JSON response with the following structure:
{{
  "executive_summary": "2-3 sentence overview for executive leadership",
  "key_findings": ["finding1", "finding2", "finding3"],
  "recommendations": ["actionable rec1", "actionable rec2", "actionable rec3"],
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL"
}}

Be concise, actionable, and data-driven. Focus on business impact.
"""
    
    return prompt


def _deterministic_polish(
    analytics_data: Dict[str, Any],
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Fallback deterministic polishing when AGNO unavailable.
    """
    score = analytics_data.get("operator_management_score", 0)
    quality = analytics_data.get("planning_quality", "UNKNOWN")
    patterns = analytics_data.get("patterns", [])
    suggestions = analytics_data.get("suggestions", [])
    forecast = analytics_data.get("forecast", {})
    
    # Determine risk level
    if score >= 75:
        risk_level = "LOW"
    elif score >= 50:
        risk_level = "MEDIUM"
    elif score >= 30:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"
    
    # Executive summary
    if quality == "GOOD":
        summary = f"Operator performance is strong with a management score of {score}/100. Current planning aligns well with operational capacity."
    elif quality == "RISK":
        summary = f"Operator performance shows moderate risk (score: {score}/100). Several patterns indicate potential capacity misalignment requiring attention."
    else:  # CRITICAL
        summary = f"Operator performance requires immediate attention (score: {score}/100). Critical capacity and decision-making issues detected."
    
    # Add forecast context
    if forecast:
        high_risk_count = forecast.get("expected_congested_slots_count", 0)
        if high_risk_count > 20:
            summary += f" Next month forecast shows {high_risk_count} high-risk time windows."
    
    # Key findings
    findings = []
    for pattern in patterns[:3]:
        findings.append(f"{pattern.get('title', 'Pattern detected')}: {pattern.get('evidence', 'N/A')}")
    
    if not findings:
        findings.append("No significant operational patterns detected in current period")
    
    # Recommendations
    recommendations = []
    for suggestion in suggestions[:3]:
        recommendations.append(f"{suggestion.get('title', 'Recommendation')}: {suggestion.get('expected_impact', 'Improve operations')}")
    
    if not recommendations:
        recommendations.append("Continue current operational practices and monitor key metrics")
    
    return {
        "executive_summary": summary,
        "key_findings": findings,
        "recommendations": recommendations,
        "risk_level": risk_level
    }
