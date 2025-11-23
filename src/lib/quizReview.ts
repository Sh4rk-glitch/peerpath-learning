export function openQuizReviewInNewTab(questions: any[], answers: Record<number, number>, meta: { title?: string, subject?: string } = {}) {
  try {
    const id = `quiz-review-${Date.now()}`;
    const payload = { questions, answers, meta };
    try {
      sessionStorage.setItem(id, JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not write quiz review to sessionStorage', e);
    }
    const url = `/quiz-review?id=${encodeURIComponent(id)}`;
    window.open(url, '_blank');
    return true;
  } catch (e) {
    console.error('openQuizReviewInNewTab error', e);
    return false;
  }
}
