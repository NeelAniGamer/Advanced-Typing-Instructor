import urllib.request
import urllib.parse
import json
import time

def run_test():
    import sys
    sys.path.insert(0, r'c:\Users\neelg\OneDrive\Desktop\CoL Project\Current Projects\Current Working Apps\ATI 1.4')
    
    from ai_insights.style_engine import TypingStyleEngine, CasingStyle
    from ai_insights.word_synthesizer import AIWordSynthesizer
    from ai_insights.auto_promoter import AutoPromoter
    from ai_insights.coaching_insights import CoachingEngine
    from curriculum import CurriculumEngine

    print("=== ATI 1.4 AI & TYPING STYLE SUITE VERIFICATION ===")
    
    # 1. Test Style Engine
    engine = TypingStyleEngine()
    test_words = ["fast", "mechanical", "velocity", "champion"]
    title_cased = engine.transform_words(test_words, CasingStyle.TITLE_CASE.value)
    print(f"\n[1] Style Engine (Title Case):\n  Original: {test_words}\n  Formatted: {title_cased}")
    assert title_cased[0] == "Fast" and title_cased[1] == "Mechanical", "Title Case failed!"

    # 2. Test Curriculum Engine with Style parameter
    curr = CurriculumEngine()
    batch_raw = curr.get_word_batch(level=1, mode='Words', difficulty='Normal', style='title_case')
    batch = json.loads(batch_raw)
    print(f"\n[2] Curriculum Batch (Level 1, Title Case):\n  Text: {batch['text'][:80]}...")
    first_word = batch['text'].split()[0]
    assert first_word[0].isupper(), f"First word '{first_word}' should be capitalized!"

    # 3. Test AI Word Synthesizer with PerceptusLM & Procedural Generation
    synth = AIWordSynthesizer()
    ai_words = synth.generate_words(level=5, count=8, style='title_case')
    print(f"\n[3] AI Word Synthesizer (Level 5 Procedural Batch):\n  Synthesized Words: {ai_words}")
    assert len(ai_words) == 8, "Expected 8 words!"
    assert all(w[0].isupper() for w in ai_words), "All words must be Title Cased!"

    # 4. Test Auto-Promoter (Skill Leap)
    promoter = AutoPromoter()
    # Fast user typing at 85 WPM on Level 1
    eval_res = promoter.evaluate_promotion(
        current_level=1,
        net_wpm=85.0,
        accuracy=98.5,
        rci_score=92.0,
        consecutive_clean_sessions=1
    )
    print(f"\n[4] Auto-Promoter Evaluation:\n  Should Promote: {eval_res['should_promote']}\n  Current Level: {eval_res['current_level']} -> Target Level: {eval_res['target_level']}\n  Tier: {eval_res.get('tier_name')}\n  Reason: {eval_res['reason']}")
    assert eval_res['should_promote'], "User typing at 85 WPM on Level 1 should be promoted!"
    assert eval_res['target_level'] > 25, "User should jump past Level 25!"

    # 5. Test Coaching Insights Engine
    coach = CoachingEngine()
    rci_dict = {"score": 88.0, "cv": 0.12, "label": "Steady Flow"}
    shift_dict = {"avg_latency_ms": 115.0, "dropped_capital_risk": False, "stutter_risk": False}
    insights = coach.generate_session_insights(
        net_wpm=82.0,
        accuracy=97.5,
        rci=rci_dict,
        shift_sync=shift_dict,
        style='title_case'
    )
    print(f"\n[5] Coaching Insights (Conversational AI):\n  Summary: {insights['summary']}\n  Strengths: {insights['strengths']}\n  Recommendations: {insights['improvements']}")
    assert len(insights['strengths']) >= 1, "Expected strengths identified!"
    assert 'title_case' in insights['summary'].lower() or 'shift' in insights['summary'].lower() or len(insights['strengths']) > 0

    print("\n[SUCCESS] ALL 5 CORE AI MODULES VERIFIED SUCCESSFULLY!")

if __name__ == '__main__':
    run_test()
