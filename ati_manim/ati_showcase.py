import os
from manim import *

# ── 9:16 VERTICAL CANVAS CONFIGURATION (YOUTUBE SHORTS) ──────
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9.0
config.frame_height = 16.0
config.background_color = "#141716"

# ── NON-AI PALETTE (EARTHY, ORGANIC, TACTILE) ────────────────
BG_COLOR = "#141716"          # Deep Warm Basalt
CARD_BG = "#1A1F1D"           # Deep Forest Basalt Card
CARD_BORDER = "#2E3833"       # Muted Slate Border
LINEN = "#FAF8F5"             # Warm Linen White
TERRACOTTA = "#C97D5A"        # Warm Terracotta Clay
TERRACOTTA_LIGHT = "#D98A66"
SAGE = "#7C8D81"              # Soft Sage Olive
SAGE_LIGHT = "#8FA896"
SANDSTONE = "#F0EDE8"         # Warm Oat Cream
AMBER_OCHRE = "#EBC078"       # Warm Natural Ochre
CHARCOAL = "#2D3330"          # Deep Charcoal
MUTED_TEXT = "#A3ACA7"        # Muted green-grey
EMERALD = "#5EAA7C"           # Forest Emerald

SCREENSHOT_DIR = r"c:\Users\neelg\OneDrive\Desktop\CoL Project\Current Projects\Current Working Apps\ATI 1.4\public\screenshots"

class ATIShowcaseShort(Scene):
    def construct(self):
        # ──────────────────────────────────────────────────────────
        # SCENE 1: HOOK & TITLE (0s - 5s)
        # ──────────────────────────────────────────────────────────
        top_pill = RoundedRectangle(corner_radius=0.25, width=6.2, height=0.7, fill_color=SAGE, fill_opacity=0.2, stroke_color=SAGE, stroke_width=1.5)
        top_pill.move_to(UP * 6.5)
        top_pill_text = Text("ATI 3.1 • THE TYPING TUTOR REIMAGINED", font="sans-serif", weight=BOLD, font_size=20, color=SAGE_LIGHT)
        top_pill_text.move_to(top_pill.get_center())

        title_main = Text("ADVANCED TYPING\nINSTRUCTOR", font="sans-serif", weight=BOLD, font_size=38, color=LINEN, line_spacing=1.2)
        title_main.move_to(UP * 4.8)

        version_badge = RoundedRectangle(corner_radius=0.2, width=2.8, height=0.6, fill_color=TERRACOTTA, fill_opacity=0.9, stroke_color=TERRACOTTA_LIGHT, stroke_width=2)
        version_badge.move_to(UP * 3.4)
        version_text = Text("VERSION 3.1", font="sans-serif", weight=BOLD, font_size=20, color=LINEN)
        version_text.move_to(version_badge.get_center())

        # Tactile Keycaps: F & J with physical bumps
        def make_key(char, bump=True):
            box = RoundedRectangle(corner_radius=0.2, width=1.6, height=1.6, fill_color="#222825", fill_opacity=1.0, stroke_color=TERRACOTTA, stroke_width=2.5)
            lbl = Text(char, font="sans-serif", weight=BOLD, font_size=36, color=LINEN)
            lbl.move_to(box.get_center() + UP * 0.1)
            parts = [box, lbl]
            if bump:
                ridge = RoundedRectangle(corner_radius=0.04, width=0.5, height=0.08, fill_color=TERRACOTTA, fill_opacity=1.0, stroke_width=0)
                ridge.move_to(box.get_center() + DOWN * 0.45)
                parts.append(ridge)
            return VGroup(*parts)

        key_f = make_key("F", bump=True).move_to(LEFT * 1.3 + UP * 1.2)
        key_j = make_key("J", bump=True).move_to(RIGHT * 1.3 + UP * 1.2)
        key_f_sub = Text("Left Anchor", font="sans-serif", font_size=15, color=SAGE_LIGHT).next_to(key_f, DOWN, buff=0.2)
        key_j_sub = Text("Right Anchor", font="sans-serif", font_size=15, color=TERRACOTTA_LIGHT).next_to(key_j, DOWN, buff=0.2)
        keys_group = VGroup(key_f, key_j, key_f_sub, key_j_sub)

        # Hook description card
        desc_card = RoundedRectangle(corner_radius=0.3, width=7.6, height=2.4, fill_color=CARD_BG, fill_opacity=0.95, stroke_color=CARD_BORDER, stroke_width=1.5)
        desc_card.move_to(DOWN * 2.8)
        desc_h = Text("Native Desktop Typing Engine", font="sans-serif", weight=BOLD, font_size=22, color=AMBER_OCHRE)
        desc_h.move_to(desc_card.get_top() + DOWN * 0.45)
        desc_b1 = Text("• 100% Offline PyWebView + Local SQLite", font="sans-serif", font_size=17, color=LINEN).move_to(desc_card.get_top() + DOWN * 0.95)
        desc_b2 = Text("• Organic Innovation High-Contrast Theme", font="sans-serif", font_size=17, color=LINEN).move_to(desc_card.get_top() + DOWN * 1.4)
        desc_b3 = Text("• Real-Time Rhythm & Cadence Telemetry", font="sans-serif", font_size=17, color=LINEN).move_to(desc_card.get_top() + DOWN * 1.85)
        desc_content = VGroup(desc_card, desc_h, desc_b1, desc_b2, desc_b3)

        self.play(FadeIn(top_pill), FadeIn(top_pill_text), Write(title_main), run_time=0.7)
        self.play(GrowFromCenter(version_badge), FadeIn(version_text), run_time=0.4)
        self.play(FadeIn(keys_group, shift=UP * 0.3), run_time=0.6)
        self.play(FadeIn(desc_content, shift=UP * 0.3), run_time=0.6)
        self.wait(2.2)

        # ──────────────────────────────────────────────────────────
        # TRANSITION TO SCENE 2: ORGANIC THEMES (5s - 11s)
        # ──────────────────────────────────────────────────────────
        self.play(
            FadeOut(title_main), FadeOut(version_badge), FadeOut(version_text),
            FadeOut(keys_group), FadeOut(desc_content),
            top_pill_text.animate.become(Text("FEATURE 1 • DESIGN SYSTEM", font="sans-serif", weight=BOLD, font_size=19, color=TERRACOTTA_LIGHT)),
            run_time=0.5
        )

        s2_title = Text("ORGANIC INNOVATION\nDUAL THEMES", font="sans-serif", weight=BOLD, font_size=32, color=LINEN, line_spacing=1.1)
        s2_title.move_to(UP * 5.0)

        # Screenshot frame: Organic Light Dashboard
        dash_img_path = os.path.join(SCREENSHOT_DIR, "organic_light_dashboard.png")
        if os.path.exists(dash_img_path):
            dash_img = ImageMobject(dash_img_path).scale_to_fit_width(7.4)
            dash_img.move_to(UP * 1.4)
            img_frame = RoundedRectangle(corner_radius=0.2, width=dash_img.width + 0.1, height=dash_img.height + 0.1, stroke_color=TERRACOTTA, stroke_width=2.5)
            img_frame.move_to(dash_img.get_center())
            dash_view = Group(img_frame, dash_img)
        else:
            dash_view = RoundedRectangle(corner_radius=0.2, width=7.4, height=4.2, fill_color="#222825", fill_opacity=1, stroke_color=TERRACOTTA, stroke_width=2.5).move_to(UP * 1.4)

        # Theme highlights card
        s2_card = RoundedRectangle(corner_radius=0.3, width=7.6, height=3.4, fill_color=CARD_BG, fill_opacity=0.95, stroke_color=CARD_BORDER, stroke_width=1.5)
        s2_card.move_to(DOWN * 3.6)
        s2_h = Text("Natural Contrast & Tactile Calm", font="sans-serif", weight=BOLD, font_size=20, color=SAGE_LIGHT)
        s2_h.move_to(s2_card.get_top() + DOWN * 0.45)
        s2_p1 = Text("✓ Warm Linen (#FAF8F5) Primary Light Mode", font="sans-serif", font_size=16, color=LINEN).move_to(s2_card.get_top() + DOWN * 1.0)
        s2_p2 = Text("✓ Deep Basalt (#141716) Eye-Relaxed Dark Mode", font="sans-serif", font_size=16, color=LINEN).move_to(s2_card.get_top() + DOWN * 1.55)
        s2_p3 = Text("✓ Enhanced Dropdown Contrast & Readability", font="sans-serif", font_size=16, color=AMBER_OCHRE).move_to(s2_card.get_top() + DOWN * 2.1)
        s2_p4 = Text("✓ Clean HeroUI & React Bits Micro-Interactions", font="sans-serif", font_size=16, color=LINEN).move_to(s2_card.get_top() + DOWN * 2.65)
        s2_details = VGroup(s2_card, s2_h, s2_p1, s2_p2, s2_p3, s2_p4)

        self.play(Write(s2_title), FadeIn(dash_view, shift=UP * 0.4), run_time=0.6)
        self.play(FadeIn(s2_details, shift=UP * 0.3), run_time=0.6)
        self.wait(2.5)

        # ──────────────────────────────────────────────────────────
        # TRANSITION TO SCENE 3: AI WORDS SYNTHESIZER (11s - 17s)
        # ──────────────────────────────────────────────────────────
        self.play(
            FadeOut(s2_title), FadeOut(dash_view), FadeOut(s2_details),
            top_pill_text.animate.become(Text("FEATURE 2 • AI VOCABULARY", font="sans-serif", weight=BOLD, font_size=19, color=AMBER_OCHRE)),
            run_time=0.5
        )

        s3_title = Text("AI WORD SYNTHESIZER\nWITH FROSTED BLUR", font="sans-serif", weight=BOLD, font_size=30, color=LINEN, line_spacing=1.1)
        s3_title.move_to(UP * 5.0)

        ai_img_path = os.path.join(SCREENSHOT_DIR, "popup_frosted_blur_bg.png")
        if os.path.exists(ai_img_path):
            ai_img = ImageMobject(ai_img_path).scale_to_fit_width(7.4)
            ai_img.move_to(UP * 1.4)
            ai_frame = RoundedRectangle(corner_radius=0.2, width=ai_img.width + 0.1, height=ai_img.height + 0.1, stroke_color=SAGE, stroke_width=2.5)
            ai_frame.move_to(ai_img.get_center())
            ai_view = Group(ai_frame, ai_img)
        else:
            ai_view = RoundedRectangle(corner_radius=0.2, width=7.4, height=4.2, fill_color="#222825", fill_opacity=1, stroke_color=SAGE, stroke_width=2.5).move_to(UP * 1.4)

        s3_card = RoundedRectangle(corner_radius=0.3, width=7.6, height=3.4, fill_color=CARD_BG, fill_opacity=0.95, stroke_color=CARD_BORDER, stroke_width=1.5)
        s3_card.move_to(DOWN * 3.6)
        s3_h = Text("Procedural Vocabulary Generation", font="sans-serif", weight=BOLD, font_size=20, color=TERRACOTTA_LIGHT)
        s3_h.move_to(s3_card.get_top() + DOWN * 0.45)
        s3_p1 = Text("✓ Frosted Blur Overlay (z-100 focus lock)", font="sans-serif", font_size=16, color=LINEN).move_to(s3_card.get_top() + DOWN * 1.0)
        s3_p2 = Text("✓ Adaptive Words Target Typist Weaknesses", font="sans-serif", font_size=16, color=LINEN).move_to(s3_card.get_top() + DOWN * 1.55)
        s3_p3 = Text("✓ Casing Engine: Title, camelCase, snake_case", font="sans-serif", font_size=16, color=SAGE_LIGHT).move_to(s3_card.get_top() + DOWN * 2.1)
        s3_p4 = Text("✓ Seamless On/Off Toggle in Game HUD", font="sans-serif", font_size=16, color=LINEN).move_to(s3_card.get_top() + DOWN * 2.65)
        s3_details = VGroup(s3_card, s3_h, s3_p1, s3_p2, s3_p3, s3_p4)

        self.play(Write(s3_title), FadeIn(ai_view, shift=UP * 0.4), run_time=0.6)
        self.play(FadeIn(s3_details, shift=UP * 0.3), run_time=0.6)
        self.wait(2.5)

        # ──────────────────────────────────────────────────────────
        # TRANSITION TO SCENE 4: TOUCH TYPING ACADEMY (17s - 23s)
        # ──────────────────────────────────────────────────────────
        self.play(
            FadeOut(s3_title), FadeOut(ai_view), FadeOut(s3_details),
            top_pill_text.animate.become(Text("FEATURE 3 • TOUCH TYPING ACADEMY", font="sans-serif", weight=BOLD, font_size=18, color=SAGE_LIGHT)),
            run_time=0.5
        )

        s4_title = Text("STARTER TUTORIAL &\nFINGER CALIBRATION", font="sans-serif", weight=BOLD, font_size=30, color=LINEN, line_spacing=1.1)
        s4_title.move_to(UP * 5.0)

        help_img_path = os.path.join(SCREENSHOT_DIR, "help_hand_posture_guide.png")
        if os.path.exists(help_img_path):
            help_img = ImageMobject(help_img_path).scale_to_fit_width(7.4)
            help_img.move_to(UP * 1.4)
            help_frame = RoundedRectangle(corner_radius=0.2, width=help_img.width + 0.1, height=help_img.height + 0.1, stroke_color=TERRACOTTA, stroke_width=2.5)
            help_frame.move_to(help_img.get_center())
            help_view = Group(help_frame, help_img)
        else:
            help_view = RoundedRectangle(corner_radius=0.2, width=7.4, height=4.2, fill_color="#222825", fill_opacity=1, stroke_color=TERRACOTTA, stroke_width=2.5).move_to(UP * 1.4)

        s4_card = RoundedRectangle(corner_radius=0.3, width=7.6, height=3.4, fill_color=CARD_BG, fill_opacity=0.95, stroke_color=CARD_BORDER, stroke_width=1.5)
        s4_card.move_to(DOWN * 3.6)
        s4_h = Text("Hands First • Ergonomics & Drills", font="sans-serif", weight=BOLD, font_size=20, color=AMBER_OCHRE)
        s4_h.move_to(s4_card.get_top() + DOWN * 0.45)
        s4_p1 = Text("✓ Begins at Fundamentals: F & J Physical Bumps", font="sans-serif", font_size=16, color=LINEN).move_to(s4_card.get_top() + DOWN * 1.0)
        s4_p2 = Text("✓ Interactive Placement Mini-Drills & Tests", font="sans-serif", font_size=16, color=SAGE_LIGHT).move_to(s4_card.get_top() + DOWN * 1.55)
        s4_p3 = Text("✓ Prominent 'Skip Tutorial' Button for Veterans", font="sans-serif", font_size=16, color=LINEN).move_to(s4_card.get_top() + DOWN * 2.1)
        s4_p4 = Text("✓ Dedicated Top-Right Corner Help Hub", font="sans-serif", font_size=16, color=TERRACOTTA_LIGHT).move_to(s4_card.get_top() + DOWN * 2.65)
        s4_details = VGroup(s4_card, s4_h, s4_p1, s4_p2, s4_p3, s4_p4)

        self.play(Write(s4_title), FadeIn(help_view, shift=UP * 0.4), run_time=0.6)
        self.play(FadeIn(s4_details, shift=UP * 0.3), run_time=0.6)
        self.wait(2.5)

        # ──────────────────────────────────────────────────────────
        # TRANSITION TO SCENE 5: DAILY CHALLENGE MULTI-MODE (23s - 29s)
        # ──────────────────────────────────────────────────────────
        self.play(
            FadeOut(s4_title), FadeOut(help_view), FadeOut(s4_details),
            top_pill_text.animate.become(Text("FEATURE 4 • DAILY CHALLENGE", font="sans-serif", weight=BOLD, font_size=19, color=TERRACOTTA_LIGHT)),
            run_time=0.5
        )

        s5_title = Text("SYNCHRONIZED DAILY\nWORDS • SENTENCES • PARAGRAPHS", font="sans-serif", weight=BOLD, font_size=26, color=LINEN, line_spacing=1.2)
        s5_title.move_to(UP * 5.0)

        # 3 Mode Cards side by side or stacked
        def make_mode_card(title, desc, reward, color, pos):
            c = RoundedRectangle(corner_radius=0.25, width=7.4, height=1.7, fill_color=CARD_BG, fill_opacity=0.95, stroke_color=color, stroke_width=2.0)
            c.move_to(pos)
            t = Text(title, font="sans-serif", weight=BOLD, font_size=20, color=color).move_to(c.get_left() + RIGHT * 1.5 + UP * 0.3)
            d = Text(desc, font="sans-serif", font_size=14, color=MUTED_TEXT).move_to(c.get_left() + RIGHT * 2.5 + DOWN * 0.3)
            r = Text(reward, font="sans-serif", weight=BOLD, font_size=18, color=AMBER_OCHRE).move_to(c.get_right() + LEFT * 1.2)
            return VGroup(c, t, d, r)

        c_words = make_mode_card("1. Words Sprint", "Isolated high-velocity vocabulary", "+1,000 💎", TERRACOTTA, UP * 2.2)
        c_sents = make_mode_card("2. Natural Sentences", "Fluid punctuation & home row flow", "+1,500 💎", SAGE_LIGHT, UP * 0.2)
        c_paras = make_mode_card("3. Deep Paragraphs", "Multi-paragraph endurance mastery", "+2,500 💎", AMBER_OCHRE, DOWN * 1.8)

        s5_footer = Text("Synchronized Global Seed Syncs Across Typists Daily", font="sans-serif", font_size=16, color=MUTED_TEXT)
        s5_footer.move_to(DOWN * 3.8)

        self.play(Write(s5_title), run_time=0.5)
        self.play(FadeIn(c_words, shift=RIGHT * 0.3), run_time=0.4)
        self.play(FadeIn(c_sents, shift=LEFT * 0.3), run_time=0.4)
        self.play(FadeIn(c_paras, shift=RIGHT * 0.3), run_time=0.4)
        self.play(FadeIn(s5_footer), run_time=0.4)
        self.wait(2.6)

        # ──────────────────────────────────────────────────────────
        # TRANSITION TO SCENE 6: FAIR PASSING & EMERALD VAULT (29s - 35s)
        # ──────────────────────────────────────────────────────────
        self.play(
            FadeOut(s5_title), FadeOut(c_words), FadeOut(c_sents), FadeOut(c_paras), FadeOut(s5_footer),
            top_pill_text.animate.become(Text("FEATURE 5 • FAIR PROGRESSION", font="sans-serif", weight=BOLD, font_size=18, color=EMERALD)),
            run_time=0.5
        )

        s6_title = Text("PERCENTAGE ACCURACY\n& EMERALD REWARDS", font="sans-serif", weight=BOLD, font_size=30, color=LINEN, line_spacing=1.1)
        s6_title.move_to(UP * 5.0)

        res_img_path = os.path.join(SCREENSHOT_DIR, "level_passed_results.png")
        if os.path.exists(res_img_path):
            res_img = ImageMobject(res_img_path).scale_to_fit_width(7.4)
            res_img.move_to(UP * 1.4)
            res_frame = RoundedRectangle(corner_radius=0.2, width=res_img.width + 0.1, height=res_img.height + 0.1, stroke_color=EMERALD, stroke_width=2.5)
            res_frame.move_to(res_img.get_center())
            res_view = Group(res_frame, res_img)
        else:
            res_view = RoundedRectangle(corner_radius=0.2, width=7.4, height=4.2, fill_color="#222825", fill_opacity=1, stroke_color=EMERALD, stroke_width=2.5).move_to(UP * 1.4)

        s6_card = RoundedRectangle(corner_radius=0.3, width=7.6, height=3.4, fill_color=CARD_BG, fill_opacity=0.95, stroke_color=CARD_BORDER, stroke_width=1.5)
        s6_card.move_to(DOWN * 3.6)
        s6_h = Text("Skill Progression Based on Precision", font="sans-serif", weight=BOLD, font_size=20, color=EMERALD)
        s6_h.move_to(s6_card.get_top() + DOWN * 0.45)
        s6_p1 = Text("✓ 85%+ Accuracy Pass Rule (No Artificial Blocks)", font="sans-serif", font_size=16, color=LINEN).move_to(s6_card.get_top() + DOWN * 1.0)
        s6_p2 = Text("✓ Instant Emerald Rewards for Level Completion", font="sans-serif", font_size=16, color=AMBER_OCHRE).move_to(s6_card.get_top() + DOWN * 1.55)
        s6_p3 = Text("✓ Live Ghost Rider Velocity & Net WPM Tracking", font="sans-serif", font_size=16, color=LINEN).move_to(s6_card.get_top() + DOWN * 2.1)
        s6_p4 = Text("✓ Offline Dual-Client LAN Multiplayer Racing", font="sans-serif", font_size=16, color=SAGE_LIGHT).move_to(s6_card.get_top() + DOWN * 2.65)
        s6_details = VGroup(s6_card, s6_h, s6_p1, s6_p2, s6_p3, s6_p4)

        self.play(Write(s6_title), FadeIn(res_view, shift=UP * 0.4), run_time=0.6)
        self.play(FadeIn(s6_details, shift=UP * 0.3), run_time=0.6)
        self.wait(2.5)

        # ──────────────────────────────────────────────────────────
        # TRANSITION TO SCENE 7: CALL TO ACTION (35s - 40s)
        # ──────────────────────────────────────────────────────────
        self.play(
            FadeOut(s6_title), FadeOut(res_view), FadeOut(s6_details),
            top_pill_text.animate.become(Text("READY TO DOWNLOAD • ATI 3.1", font="sans-serif", weight=BOLD, font_size=19, color=LINEN)),
            run_time=0.5
        )

        cta_title = Text("EXPERIENCE ATI 3.1\nTODAY", font="sans-serif", weight=BOLD, font_size=38, color=LINEN, line_spacing=1.2)
        cta_title.move_to(UP * 4.2)

        cta_badge = RoundedRectangle(corner_radius=0.3, width=6.8, height=1.4, fill_color=TERRACOTTA, fill_opacity=0.95, stroke_color=TERRACOTTA_LIGHT, stroke_width=2.5)
        cta_badge.move_to(UP * 1.5)
        cta_badge_text = Text("WINDOWS STANDALONE EXE\nREADY FOR PRODUCTION", font="sans-serif", weight=BOLD, font_size=20, color=LINEN, line_spacing=1.2)
        cta_badge_text.move_to(cta_badge.get_center())

        checklist_card = RoundedRectangle(corner_radius=0.3, width=7.6, height=4.2, fill_color=CARD_BG, fill_opacity=0.95, stroke_color=CARD_BORDER, stroke_width=1.5)
        checklist_card.move_to(DOWN * 2.2)

        items = [
            "✔ 100% Offline Capable & Instant Launch",
            "✔ Zero AI Clutter • Calming Organic Palette",
            "✔ Touch Typing Academy with Ergonomics Guide",
            "✔ Multi-Mode Daily Challenge (Words & Paras)",
            "✔ Fair Percentage Level Passing & Gems",
            "✔ Local Dual-App Multiplayer LAN Testing"
        ]
        text_items = []
        for idx, it in enumerate(items):
            color = AMBER_OCHRE if "Organic" in it or "Daily" in it else LINEN
            ti = Text(it, font="sans-serif", font_size=16, color=color)
            ti.move_to(checklist_card.get_top() + DOWN * (0.55 + idx * 0.58))
            text_items.append(ti)

        footer_text = Text("Created by Class Of Learners • ATI v3.1.0", font="sans-serif", font_size=15, color=MUTED_TEXT)
        footer_text.move_to(DOWN * 5.5)

        self.play(Write(cta_title), GrowFromCenter(cta_badge), FadeIn(cta_badge_text), run_time=0.6)
        self.play(FadeIn(checklist_card), *[FadeIn(ti, shift=UP * 0.15) for ti in text_items], run_time=0.8)
        self.play(FadeIn(footer_text), run_time=0.4)
        self.wait(3.0)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)
        self.wait(0.5)
