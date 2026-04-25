import { Router }              from 'express';
import { requireSession }      from '../middleware/requireSession.js';
import { setConversationHistory } from '../auth/sessions.js';
import { handleChatTurn, mainMenuOptions } from '../chatbot/geminiAgent.js';
import { findUserById }        from '../data/repository.js';

const router = Router();

/**
 * GET /api/chat/bootstrap
 * Returns the initial greeting and main menu.
 * Resets the conversation history for this session.
 */
router.get('/bootstrap', requireSession, async (req, res, next) => {
  try {
    const user = await findUserById(req.session.userId);
    const hour = new Date().getHours();
    const tod  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Fresh conversation on every bootstrap (new login / page reload)
    setConversationHistory(req.sessionToken, []);

    res.json({
      response: {
        messages: [{
          role: 'assistant',
          text: `${tod}, ${user.fullName.split(' ')[0]}! I'm BanklifyAi, your AI banking assistant.\n\nI can help you with: balance, fund transfers, bill payments, transactions, and card blocking.\n\nWhat would you like to do?`
        }],
        options: mainMenuOptions(),
        state: 'IDLE'
      },
      sessionRemainingMs: req.sessionRemainingMs
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/chat
 * Body: { text?: string, optionValue?: string }
 *   — button clicks send optionValue (the human-readable button value)
 *   — typed messages send text
 * Returns: { response: { messages, options, receipt? }, sessionRemainingMs }
 */
router.post('/', requireSession, async (req, res, next) => {
  try {
    // Buttons send their value as `optionValue`; treat it identically to typed text
    const userMessage = (req.body?.text || req.body?.optionValue || '').trim();

    if (!userMessage) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Message cannot be empty.' });
    }

    const history = req.session.conversationHistory || [];

    const { text, options, receipt, conversationHistory } = await handleChatTurn({
      userId:              req.session.userId,
      userMessage,
      conversationHistory: history
    });

    // Persist the updated history in the session
    setConversationHistory(req.sessionToken, conversationHistory);

    res.json({
      response: {
        messages: [{ role: 'assistant', text }],
        options:  options || null,
        receipt:  receipt || null,
        state:    'IDLE'
      },
      sessionRemainingMs: req.sessionRemainingMs
    });
  } catch (err) { next(err); }
});

export default router;
