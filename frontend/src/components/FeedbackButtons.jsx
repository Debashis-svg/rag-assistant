import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

function FeedbackButtons({ messageId }) {
  const [feedback, setFeedback] = useState(null);

  const handleFeedback = async (value) => {
    setFeedback((prev) => (prev === value ? null : value));

    try {
      /*
      Later backend integration:

      await api.post('/feedback', {
        messageId,
        value
      });
      */

      console.log('Feedback:', {
        messageId,
        value
      });
    } catch (err) {
      console.error('Unable to save feedback');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleFeedback('like')}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
          feedback === 'like'
            ? 'bg-emerald-50 text-emerald-600'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
        aria-label="Helpful response"
        title="Helpful"
      >
        <ThumbsUp
          size={15}
          className={feedback === 'like' ? 'fill-current' : ''}
        />
      </button>

      <button
        type="button"
        onClick={() => handleFeedback('dislike')}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
          feedback === 'dislike'
            ? 'bg-red-50 text-red-500'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
        aria-label="Not helpful response"
        title="Not helpful"
      >
        <ThumbsDown
          size={15}
          className={feedback === 'dislike' ? 'fill-current' : ''}
        />
      </button>
    </div>
  );
}

export default FeedbackButtons;