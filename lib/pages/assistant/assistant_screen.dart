import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/assistant_controller.dart';

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final AssistantController controller = Get.find<AssistantController>();
  final TextEditingController inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    controller.loadHistory().then((_) => _scrollToBottom());
  }

  @override
  void dispose() {
    inputController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              Expanded(
                child: Obx(() {
                  if (controller.loading.value) {
                    return _buildLoadingState();
                  }

                  final msgs = controller.messages;

                  if (msgs.isEmpty && controller.error.value == null) {
                    return _buildEmptyState();
                  }

                  return _buildMessageList(msgs);
                }),
              ),
              _buildTypingIndicator(),
              _buildInputArea(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFF1E3A5F), const Color(0xFF0D2540)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF2F80ED).withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.support_agent_rounded,
              color: const Color(0xFF2F80ED),
              size: 24.sp,
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Assistant Portuaire',
                  style: TextStyle(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Obx(
                  () => Text(
                    controller.sending.value
                        ? 'En train d\'écrire...'
                        : 'En ligne',
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: controller.sending.value
                          ? const Color(0xFF2F80ED)
                          : Colors.greenAccent,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => _showOptionsMenu(),
            icon: Icon(
              Icons.more_vert_rounded,
              color: Colors.white70,
              size: 24.sp,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList(List<dynamic> msgs) {
    return ListView.builder(
      controller: _scrollController,
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 20.h),
      physics: const BouncingScrollPhysics(),
      itemCount: msgs.length,
      itemBuilder: (context, index) {
        final m = msgs[index];
        final fromUser = m['role'] == 'user' || m['sender'] == 'user';
        final isFirstInGroup =
            index == 0 ||
            (msgs[index - 1]['role'] != m['role'] &&
                msgs[index - 1]['sender'] != m['sender']);
        final isLastInGroup =
            index == msgs.length - 1 ||
            (msgs[index + 1]['role'] != m['role'] &&
                msgs[index + 1]['sender'] != m['sender']);

        return _buildChatBubble(m, fromUser, isFirstInGroup, isLastInGroup);
      },
    );
  }

  Widget _buildChatBubble(
    Map<String, dynamic> m,
    bool fromUser,
    bool isFirstInGroup,
    bool isLastInGroup,
  ) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: isLastInGroup ? 16.h : 2.h,
        top: isFirstInGroup ? 8.h : 0,
      ),
      child: Row(
        mainAxisAlignment: fromUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!fromUser && isLastInGroup) ...[
            Container(
              width: 32.w,
              height: 32.w,
              margin: EdgeInsets.only(right: 8.w, bottom: 4.h),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2F80ED), Color(0xFF1E5BB8)],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2F80ED).withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                Icons.smart_toy_rounded,
                color: Colors.white,
                size: 18.sp,
              ),
            ),
          ] else if (!fromUser) ...[
            SizedBox(width: 40.w),
          ],
          Flexible(
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              decoration: BoxDecoration(
                gradient: fromUser
                    ? const LinearGradient(
                        colors: [Color(0xFF2F80ED), Color(0xFF1E5BB8)],
                      )
                    : null,
                color: fromUser ? null : const Color(0xFF1A2F45),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20.r),
                  topRight: Radius.circular(20.r),
                  bottomLeft: Radius.circular(fromUser ? 20.r : 4.r),
                  bottomRight: Radius.circular(fromUser ? 4.r : 20.r),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    (m['text'] ?? m['message'] ?? m['content'] ?? '')
                        .toString(),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.sp,
                      height: 1.4,
                      letterSpacing: 0.2,
                    ),
                  ),
                  if (m['timestamp'] != null) ...[
                    SizedBox(height: 4.h),
                    Text(
                      _formatTimestamp(m['timestamp']),
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 10.sp,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (fromUser && isLastInGroup) ...[SizedBox(width: 8.w)],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Obx(
      () => AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: controller.sending.value ? 40.h : 0,
        child: controller.sending.value
            ? Padding(
                padding: EdgeInsets.only(left: 56.w, bottom: 8.h),
                child: Row(
                  children: [
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 8.h,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1A2F45),
                        borderRadius: BorderRadius.circular(20.r),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildTypingDot(0),
                          SizedBox(width: 4.w),
                          _buildTypingDot(1),
                          SizedBox(width: 4.w),
                          _buildTypingDot(2),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            : const SizedBox.shrink(),
      ),
    );
  }

  Widget _buildTypingDot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      builder: (context, value, child) {
        final delay = index * 0.2;
        final animValue = (value - delay).clamp(0.0, 1.0);
        return Transform.translate(
          offset: Offset(0, -4 * (1 - (animValue * 2 - 1).abs())),
          child: Container(
            width: 6.w,
            height: 6.w,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.6),
              shape: BoxShape.circle,
            ),
          ),
        );
      },
      onEnd: () {
        if (mounted) setState(() {});
      },
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 16.h),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1F31),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              constraints: BoxConstraints(minHeight: 48.h, maxHeight: 120.h),
              decoration: BoxDecoration(
                color: const Color(0xFF1F3A57),
                borderRadius: BorderRadius.circular(24.r),
                border: Border.all(
                  color: const Color(0xFF4A90E2).withOpacity(0.3),
                  width: 1.5,
                ),
              ),
              child: TextField(
                controller: inputController,
                focusNode: _focusNode,
                maxLines: null,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15.sp,
                  height: 1.5,
                  fontWeight: FontWeight.w500,
                ),
                cursorColor: const Color(0xFF4A90E2),
                cursorWidth: 2.5,
                cursorHeight: 22.h,
                decoration: InputDecoration(
                  hintText: 'Demandez un créneau ou une info...',
                  hintStyle: TextStyle(
                    color: Colors.white.withOpacity(0.35),
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w400,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 20.w,
                    vertical: 14.h,
                  ),
                ),
                onSubmitted: (_) => _handleSend(),
              ),
            ),
          ),
          SizedBox(width: 8.w),
          Obx(
            () => AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 48.w,
              height: 48.w,
              decoration: BoxDecoration(
                gradient:
                    inputController.text.isNotEmpty && !controller.sending.value
                    ? const LinearGradient(
                        colors: [Color(0xFF4A90E2), Color(0xFF2E5C8A)],
                      )
                    : null,
                color: inputController.text.isEmpty || controller.sending.value
                    ? Colors.white.withOpacity(0.1)
                    : null,
                shape: BoxShape.circle,
                boxShadow:
                    inputController.text.isNotEmpty && !controller.sending.value
                    ? [
                        BoxShadow(
                          color: const Color(0xFF4A90E2).withOpacity(0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(24.r),
                  onTap: controller.sending.value ? null : _handleSend,
                  child: Icon(
                    controller.sending.value
                        ? Icons.stop_rounded
                        : Icons.send_rounded,
                    color: Colors.white,
                    size: 22.sp,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handleSend() {
    if (inputController.text.trim().isEmpty) return;
    final msg = inputController.text;
    inputController.clear();
    controller.sendMessage(msg).then((_) => _scrollToBottom());
    _focusNode.unfocus();
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(32.w),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF2F80ED).withOpacity(0.2),
                    const Color(0xFF1E5BB8).withOpacity(0.1),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline_rounded,
                size: 48.sp,
                color: const Color(0xFF2F80ED),
              ),
            ),
            SizedBox(height: 24.h),
            Text(
              'Comment puis-je vous aider ?',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 8.h),
            Text(
              'Posez vos questions sur les créneaux,\nles navires ou les opérations portuaires',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 13.sp,
                height: 1.4,
              ),
            ),
            SizedBox(height: 32.h),
            _buildSuggestionChips(),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionChips() {
    final suggestions = [
      '📅 Créneaux disponibles',
      '🚢 État des navires',
      '📊 Statistiques du jour',
    ];

    return Wrap(
      spacing: 8.w,
      runSpacing: 8.h,
      alignment: WrapAlignment.center,
      children: suggestions.map((suggestion) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(20.r),
            onTap: () {
              inputController.text = suggestion.substring(2).trim();
              _handleSend();
            },
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: const Color(0xFF1A2F45),
                borderRadius: BorderRadius.circular(20.r),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Text(
                suggestion,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 13.sp,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2F80ED)),
          ),
          SizedBox(height: 16.h),
          Text(
            'Chargement de l\'historique...',
            style: TextStyle(
              color: Colors.white.withOpacity(0.6),
              fontSize: 13.sp,
            ),
          ),
        ],
      ),
    );
  }

  void _showOptionsMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A2F45),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.refresh, color: Colors.white70),
              title: const Text(
                'Actualiser',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                controller.loadHistory().then((_) => _scrollToBottom());
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.delete_outline,
                color: Colors.redAccent,
              ),
              title: const Text(
                'Effacer l\'historique',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                // Implémenter la logique de suppression
              },
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(dynamic timestamp) {
    DateTime? dt;
    if (timestamp is DateTime) {
      dt = timestamp;
    } else if (timestamp is int) {
      // Epoch milliseconds/seconds
      dt = timestamp > 1000000000000
          ? DateTime.fromMillisecondsSinceEpoch(timestamp)
          : DateTime.fromMillisecondsSinceEpoch(timestamp * 1000);
    } else {
      dt = DateTime.tryParse(timestamp.toString());
    }

    if (dt == null) return '';
    final t = TimeOfDay.fromDateTime(dt.toLocal());
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
