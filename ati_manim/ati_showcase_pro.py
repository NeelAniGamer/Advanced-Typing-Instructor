import os
import math
from manim import *

# ── 9:16 VERTICAL SHORT CANVAS (YOUTUBE SHORTS / REELS) ──────
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9.0
config.frame_height = 16.0
config.background_color = "#0E1110"  # Ultra deep obsidian basalt

# ── NON-AI EARTHY COLOR PALETTE (ORGANIC, HUMAN, CRAFTED) ─────
BG_DARK = "#0E1110"           # Deepest Obsidian Slate
BG_SURFACE = "#161B18"        # Card Base Slate
BG_ELEVATED = "#1F2622"       # Elevated Card Surface
BORDER_SUBTLE = "#2C3730"     # Slate Edge
BORDER_FOCUS = "#C97D5A"      # Terracotta Border
LINEN_WHITE = "#FAF8F5"       # Warm Pure Linen
SANDSTONE = "#E6E1DA"         # Warm Off-white
CHARCOAL = "#252B28"          # Deep Charcoal
TERRACOTTA = "#C97D5A"        # Warm Terracotta
TERRA_LIGHT = "#E29370"       # Vibrant Terracotta Highlight
SAGE = "#7C8D81"              # Sage Olive
SAGE_LIGHT = "#9EB3A5"        # Sage Highlight
OCHRE = "#EBC078"             # Warm Ochre / Honey
EMERALD = "#5EAA7C"           # Radiant Gem Emerald
EMERALD_GLOW = "#75D29B"      # Emerald Sparkle

# ── HELPER: VECTOR MOUSE CURSOR ──────────────────────────────
def create_cursor():
    # Crisp macOS-style vector arrow
    points = [
        [0, 0, 0],
        [0, -0.7, 0],
        [0.2, -0.52, 0],
        [0.42, -0.85, 0],
        [0.55, -0.78, 0],
        [0.32, -0.46, 0],
        [0.58, -0.46, 0],
        [0, 0, 0]
    ]
    cursor = Polygon(
        *points,
        fill_color=LINEN_WHITE,
        fill_opacity=1.0,
        stroke_color="#141716",
        stroke_width=2.5
    )
    cursor.scale(0.8)
    return cursor

# ── HELPER: CLICK RIPPLE ANIMATION ───────────────────────────
def make_click_ripple(pos, color=TERRA_LIGHT, max_radius=0.7):
    ripple = Circle(radius=0.1, color=color, stroke_width=3.5, stroke_opacity=0.9)
    ripple.move_to(pos)
    anim = Succession(
        AnimationGroup(
            ripple.animate.scale(max_radius / 0.1).set_stroke(opacity=0),
            run_time=0.45,
            rate_func=rate_functions.ease_out_quad
        )
    )
    return ripple, anim

# ── HELPER: APP WINDOW HEADER WITH TRAFFIC LIGHTS ────────────
def create_window_frame(width=8.0, height=11.5, title="ATI v3.1.0 • Native Desktop"):
    # Shadow layer (for 2.5D depth)
    shadow = RoundedRectangle(
        corner_radius=0.35, width=width + 0.1, height=height + 0.1,
        fill_color="#000000", fill_opacity=0.45, stroke_width=0
    ).shift(DOWN * 0.15 + RIGHT * 0.05)

    # Main Card Base
    card = RoundedRectangle(
        corner_radius=0.35, width=width, height=height,
        fill_color=BG_SURFACE, fill_opacity=0.98,
        stroke_color=BORDER_SUBTLE, stroke_width=1.8
    )

    # Window Header Bar
    hdr_h = 0.85
    hdr_bar = RoundedRectangle(
        corner_radius=0.35, width=width, height=hdr_h,
        fill_color=BG_ELEVATED, fill_opacity=1.0,
        stroke_color=BORDER_SUBTLE, stroke_width=1.5
    )
    hdr_bar.align_to(card, UP)

    # Traffic light window dots
    d_red = Dot(radius=0.11, color="#FF5F56").move_to(hdr_bar.get_left() + RIGHT * 0.45)
    d_yel = Dot(radius=0.11, color="#FFBD2E").next_to(d_red, RIGHT, buff=0.18)
    d_grn = Dot(radius=0.11, color="#27C93F").next_to(d_yel, RIGHT, buff=0.18)
    dots = VGroup(d_red, d_yel, d_grn)

    # Header Title
    title_lbl = Text(title, font="sans-serif", weight=SEMIBOLD, font_size=17, color=SAGE_LIGHT)
    title_lbl.move_to(hdr_bar.get_center())

    # Corner status badge
    status_pill = RoundedRectangle(corner_radius=0.12, width=1.5, height=0.38, fill_color=EMERALD, fill_opacity=0.25, stroke_color=EMERALD, stroke_width=1)
    status_lbl = Text("OFFLINE", font="sans-serif", weight=BOLD, font_size=12, color=EMERALD_GLOW)
    status_lbl.move_to(status_pill.get_center())
    status_badge = VGroup(status_pill, status_lbl).move_to(hdr_bar.get_right() + LEFT * 1.0)

    window = VGroup(shadow, card, hdr_bar, dots, title_lbl, status_badge)
    return window, card, hdr_bar

class ATIShowcasePro(MovingCameraScene):
    def construct(self):
        # ═════════════════════════════════════════════════════════════
        # 1. LAYERED AMBIENT BACKGROUND (NOT PLAIN!)
        # ═════════════════════════════════════════════════════════════
        # A. Ambient glowing radial blur orbs (Warm Terracotta + Sage)
        glow_orb_1 = Dot(radius=3.8, color=TERRACOTTA).set_opacity(0.12).move_to(UP * 4.5 + LEFT * 2.5)
        glow_orb_2 = Dot(radius=4.2, color=SAGE).set_opacity(0.10).move_to(DOWN * 4.0 + RIGHT * 2.8)
        glow_orb_3 = Dot(radius=2.5, color=OCHRE).set_opacity(0.08).move_to(ORIGIN)

        # B. Geometric Dot Grid Matrix (gives high-tech modern depth)
        dots_list = []
        for x in range(-4, 5, 2):
            for y in range(-8, 9, 2):
                d = Dot(radius=0.035, color=BORDER_SUBTLE).move_to([x * 0.95, y * 0.95, 0])
                d.set_opacity(0.4)
                dots_list.append(d)
        dot_grid = VGroup(*dots_list)

        self.add(glow_orb_1, glow_orb_2, glow_orb_3, dot_grid)

        # ═════════════════════════════════════════════════════════════
        # 2. SCENE 1: THE HIGH-ENERGY HOOK (0s - 4.5s)
        # ═════════════════════════════════════════════════════════════
        hook_tag = RoundedRectangle(corner_radius=0.2, width=4.8, height=0.65, fill_color=TERRACOTTA, fill_opacity=0.25, stroke_color=TERRACOTTA, stroke_width=1.8)
        hook_tag.move_to(UP * 5.8)
        hook_lbl = Text("★ MASSIVE V3.1 UPDATE", font="sans-serif", weight=BOLD, font_size=19, color=TERRA_LIGHT)
        hook_lbl.move_to(hook_tag.get_center())
        hook_badge = VGroup(hook_tag, hook_lbl)

        main_headline = Text("TIRED OF BORING\nTYPING TUTORS?", font="sans-serif", weight=HEAVY, font_size=38, color=LINEN_WHITE, line_spacing=1.2)
        main_headline.move_to(UP * 4.1)

        sub_headline = Text("Advanced Typing Instructor just got\na game-changing overhaul.", font="sans-serif", font_size=19, color=SAGE_LIGHT, line_spacing=1.3)
        sub_headline.next_to(main_headline, DOWN, buff=0.35)

        # Center Hero Bento Card
        hero_box = RoundedRectangle(corner_radius=0.3, width=7.2, height=4.2, fill_color=BG_SURFACE, fill_opacity=0.95, stroke_color=BORDER_SUBTLE, stroke_width=2)
        hero_box.move_to(DOWN * 0.5)

        speed_badge = RoundedRectangle(corner_radius=0.18, width=2.4, height=0.6, fill_color=EMERALD, fill_opacity=0.25, stroke_color=EMERALD, stroke_width=1.5)
        speed_badge.move_to(hero_box.get_top() + DOWN * 0.7 + LEFT * 1.8)
        speed_lbl = Text("⚡ 142 WPM", font="sans-serif", weight=BOLD, font_size=17, color=EMERALD_GLOW).move_to(speed_badge.get_center())

        acc_badge = RoundedRectangle(corner_radius=0.18, width=2.4, height=0.6, fill_color=OCHRE, fill_opacity=0.25, stroke_color=OCHRE, stroke_width=1.5)
        acc_badge.move_to(hero_box.get_top() + DOWN * 0.7 + RIGHT * 1.8)
        acc_lbl = Text("🎯 99.4% ACC", font="sans-serif", weight=BOLD, font_size=17, color=OCHRE).move_to(acc_badge.get_center())

        hero_title = Text("ATI 3.1.0", font="sans-serif", weight=BOLD, font_size=42, color=LINEN_WHITE).move_to(hero_box.get_center() + UP * 0.2)
        hero_desc = Text("Native Desktop • Zero Cloud Lag • Pure Tactile Feel", font="sans-serif", font_size=16, color=SAGE_LIGHT).next_to(hero_title, DOWN, buff=0.35)

        hero_bento = VGroup(hero_box, speed_badge, speed_lbl, acc_badge, acc_lbl, hero_title, hero_desc)

        # Entrance
        self.play(FadeIn(hook_badge, shift=DOWN*0.3), Write(main_headline), run_time=1.0)
        self.play(FadeIn(sub_headline, shift=UP*0.2), GrowFromCenter(hero_bento), run_time=1.0)
        self.wait(1.5)

        # Clean transition to App Window demo
        self.play(
            FadeOut(hook_badge, shift=UP*0.5),
            FadeOut(main_headline, shift=UP*0.5),
            FadeOut(sub_headline, shift=UP*0.5),
            FadeOut(hero_bento, scale=0.85),
            run_time=0.7
        )

        # ═════════════════════════════════════════════════════════════
        # 3. SCENE 2: INTERACTIVE DAILY CHALLENGE 3.0 (4.5s - 12s)
        # ═════════════════════════════════════════════════════════════
        window, card, hdr = create_window_frame(width=7.8, height=12.2, title="DAILY CHALLENGE 3.0")
        window.move_to(DOWN * 0.4)

        # Card Title inside window
        feature_tag = Text("FEATURE 01 // NEW REWARD MATRIX", font="sans-serif", weight=BOLD, font_size=14, color=TERRA_LIGHT)
        feature_tag.move_to(card.get_top() + DOWN * 1.3 + LEFT * 1.3)

        dc_heading = Text("Words, Sentences\n& Full Paragraphs!", font="sans-serif", weight=BOLD, font_size=28, color=LINEN_WHITE, line_spacing=1.1)
        dc_heading.next_to(feature_tag, DOWN, buff=0.25).align_to(feature_tag, LEFT)

        # Segmented Control Bar (Words | Sentences | Paragraphs)
        seg_bg = RoundedRectangle(corner_radius=0.22, width=6.8, height=0.9, fill_color=BG_ELEVATED, fill_opacity=1.0, stroke_color=BORDER_SUBTLE, stroke_width=1.5)
        seg_bg.move_to(card.get_top() + DOWN * 3.8)

        # Tab highlight pill (Animated slider!)
        tab_w = 2.15
        tab_h = 0.72
        slider_pill = RoundedRectangle(corner_radius=0.18, width=tab_w, height=tab_h, fill_color=TERRACOTTA, fill_opacity=1.0, stroke_width=0)
        slider_pill.move_to(seg_bg.get_left() + RIGHT * (tab_w / 2 + 0.12))

        lbl_words = Text("WORDS", font="sans-serif", weight=BOLD, font_size=15, color=LINEN_WHITE).move_to(slider_pill.get_center())
        lbl_sentences = Text("SENTENCES", font="sans-serif", weight=BOLD, font_size=15, color=SAGE_LIGHT).move_to(seg_bg.get_center())
        lbl_paragraphs = Text("PARAGRAPHS", font="sans-serif", weight=BOLD, font_size=15, color=SAGE_LIGHT).move_to(seg_bg.get_right() + LEFT * (tab_w / 2 + 0.12))
        tabs_labels = VGroup(lbl_words, lbl_sentences, lbl_paragraphs)

        # Dynamic Reward Display Box
        reward_box = RoundedRectangle(corner_radius=0.25, width=6.8, height=4.2, fill_color="#18201C", fill_opacity=0.95, stroke_color=BORDER_SUBTLE, stroke_width=1.8)
        reward_box.move_to(card.get_top() + DOWN * 6.8)

        rew_header = Text("STAMINA & ACCURACY CHALLENGE", font="sans-serif", weight=BOLD, font_size=13, color=OCHRE)
        rew_header.move_to(reward_box.get_top() + DOWN * 0.45)

        # Challenge preview text sample
        sample_quote = Text(
            "\"Typing speed is not just raw keystrokes;\nit is the rhythm of effortless thought.\"",
            font="serif", slant=ITALIC, font_size=17, color=SANDSTONE, line_spacing=1.3
        ).move_to(reward_box.get_center() + UP * 0.3)

        # Reward Badge Pill
        reward_pill = RoundedRectangle(corner_radius=0.2, width=4.6, height=0.8, fill_color=EMERALD, fill_opacity=0.25, stroke_color=EMERALD, stroke_width=2)
        reward_pill.move_to(reward_box.get_bottom() + UP * 0.75)
        reward_text = Text("💎 +1,000 EMERALDS", font="sans-serif", weight=BOLD, font_size=20, color=EMERALD_GLOW)
        reward_text.move_to(reward_pill.get_center())
        reward_display = VGroup(reward_pill, reward_text)

        dc_group = VGroup(
            window, feature_tag, dc_heading, seg_bg, slider_pill, tabs_labels,
            reward_box, rew_header, sample_quote, reward_display
        )

        # Animate Window Entrance
        self.play(FadeIn(dc_group, shift=UP * 0.5), run_time=0.9)

        # CAMERA DYNAMICS: Punch-zoom into the interactive segmented control!
        self.play(
            self.camera.frame.animate.scale(0.85).move_to(seg_bg.get_center() + DOWN * 0.8),
            run_time=0.8,
            rate_func=rate_functions.ease_out_cubic
        )

        # Spawn interactive vector cursor!
        cursor = create_cursor().move_to(seg_bg.get_bottom() + DOWN * 2.0 + RIGHT * 1.5)
        self.play(FadeIn(cursor, scale=0.6), run_time=0.3)

        # Cursor clicks "SENTENCES"
        target_sentences = lbl_sentences.get_center() + DOWN * 0.1
        self.play(cursor.animate.move_to(target_sentences), run_time=0.6, rate_func=rate_functions.ease_out_quad)
        
        # Click ripple + Slider slide animation
        ripple1, anim1 = make_click_ripple(target_sentences)
        new_reward_text1 = Text("💎 +1,500 EMERALDS", font="sans-serif", weight=BOLD, font_size=20, color=EMERALD_GLOW).move_to(reward_pill.get_center())
        
        self.add(ripple1)
        self.play(
            anim1,
            slider_pill.animate.move_to(lbl_sentences.get_center()),
            lbl_words.animate.set_color(SAGE_LIGHT),
            lbl_sentences.animate.set_color(LINEN_WHITE),
            Transform(reward_text, new_reward_text1),
            cursor.animate.scale(0.85),
            run_time=0.45
        )
        self.play(cursor.animate.scale(1.0 / 0.85), run_time=0.2)

        # Cursor clicks "PARAGRAPHS"
        target_paragraphs = lbl_paragraphs.get_center() + DOWN * 0.1
        self.play(cursor.animate.move_to(target_paragraphs), run_time=0.5, rate_func=rate_functions.ease_out_quad)

        # Click ripple + Slider slide + Emerald tier glow explosion
        ripple2, anim2 = make_click_ripple(target_paragraphs, color=EMERALD_GLOW)
        new_reward_text2 = Text("💎 +2,500 EMERALDS!", font="sans-serif", weight=HEAVY, font_size=20, color=OCHRE).move_to(reward_pill.get_center())
        
        self.add(ripple2)
        self.play(
            anim2,
            slider_pill.animate.move_to(lbl_paragraphs.get_center()).set_fill(EMERALD),
            lbl_sentences.animate.set_color(SAGE_LIGHT),
            lbl_paragraphs.animate.set_color(LINEN_WHITE),
            Transform(reward_text, new_reward_text2),
            reward_pill.animate.set_stroke(color=OCHRE, width=2.5),
            cursor.animate.scale(0.85),
            run_time=0.45
        )
        self.play(cursor.animate.scale(1.0 / 0.85), FadeOut(cursor), run_time=0.3)
        self.wait(1.0)

        # Camera restores to neutral
        self.play(
            self.camera.frame.animate.scale(1.0 / 0.85).move_to(ORIGIN),
            FadeOut(dc_group, shift=LEFT * 1.5),
            run_time=0.7
        )

        # ═════════════════════════════════════════════════════════════
        # 4. SCENE 3: TACTILE HOME ROW CALIBRATION & SKIP (12s - 19s)
        # ═════════════════════════════════════════════════════════════
        tut_tag = Text("FEATURE 02 // STARTER TUTORIAL", font="sans-serif", weight=BOLD, font_size=14, color=SAGE_LIGHT)
        tut_tag.move_to(UP * 5.8)

        tut_heading = Text("Tactile Anchor\nCalibration (F & J)", font="sans-serif", weight=HEAVY, font_size=34, color=LINEN_WHITE, line_spacing=1.1)
        tut_heading.next_to(tut_tag, DOWN, buff=0.25)

        # Tactile Keycap Builder (Isometric bevel style)
        def create_3d_keycap(char, bump_color=TERRA_LIGHT):
            shadow = RoundedRectangle(corner_radius=0.25, width=2.5, height=2.5, fill_color="#000000", fill_opacity=0.6, stroke_width=0).shift(DOWN * 0.12)
            base = RoundedRectangle(corner_radius=0.25, width=2.5, height=2.5, fill_color="#18201C", fill_opacity=1.0, stroke_color=BORDER_SUBTLE, stroke_width=2.5)
            top_face = RoundedRectangle(corner_radius=0.2, width=2.1, height=2.1, fill_color="#24302A", fill_opacity=1.0, stroke_width=0).shift(UP * 0.08)
            label = Text(char, font="sans-serif", weight=HEAVY, font_size=46, color=LINEN_WHITE).move_to(top_face.get_center() + UP * 0.15)
            
            # Physical tactile bump line
            bump = RoundedRectangle(corner_radius=0.05, width=0.85, height=0.12, fill_color=bump_color, fill_opacity=1.0, stroke_width=0)
            bump.move_to(top_face.get_center() + DOWN * 0.55)
            
            return VGroup(shadow, base, top_face, label, bump), top_face, label, bump

        key_f_grp, f_face, f_lbl, f_bump = create_3d_keycap("F", TERRACOTTA)
        key_j_grp, j_face, j_lbl, j_bump = create_3d_keycap("J", SAGE)

        key_f_grp.move_to(LEFT * 1.7 + UP * 0.6)
        key_j_grp.move_to(RIGHT * 1.7 + UP * 0.6)

        sub_f = Text("Left Index Finger", font="sans-serif", font_size=14, color=SAGE_LIGHT).next_to(key_f_grp, DOWN, buff=0.25)
        sub_j = Text("Right Index Finger", font="sans-serif", font_size=14, color=SAGE_LIGHT).next_to(key_j_grp, DOWN, buff=0.25)

        # Status badge below keys
        cal_status_box = RoundedRectangle(corner_radius=0.2, width=6.2, height=0.8, fill_color=BG_ELEVATED, fill_opacity=0.9, stroke_color=BORDER_SUBTLE, stroke_width=1.5)
        cal_status_box.move_to(DOWN * 2.2)
        cal_status_txt = Text("PRESS ANCHOR KEYS TO CALIBRATE", font="sans-serif", weight=BOLD, font_size=15, color=OCHRE)
        cal_status_txt.move_to(cal_status_box.get_center())

        # Skip Tutorial Button (Explicitly requested feature!)
        skip_btn_box = RoundedRectangle(corner_radius=0.2, width=4.8, height=0.7, fill_color="#222B26", fill_opacity=1.0, stroke_color=BORDER_FOCUS, stroke_width=1.8)
        skip_btn_box.move_to(DOWN * 3.4)
        skip_btn_txt = Text("⚡ SKIP TUTORIAL (INSTANT START)", font="sans-serif", weight=BOLD, font_size=14, color=LINEN_WHITE)
        skip_btn_txt.move_to(skip_btn_box.get_center())
        skip_btn = VGroup(skip_btn_box, skip_btn_txt)

        tut_scene = VGroup(
            tut_tag, tut_heading, key_f_grp, key_j_grp, sub_f, sub_j,
            cal_status_box, cal_status_txt, skip_btn
        )

        self.play(FadeIn(tut_scene, shift=DOWN * 0.4), run_time=0.9)

        # SIMULATE TACTILE PRESS ON 'F':
        # Key dips down, wave ripples outward
        ripple_f = Circle(radius=0.2, color=TERRA_LIGHT, stroke_width=4, stroke_opacity=0.9).move_to(key_f_grp.get_center())
        self.add(ripple_f)
        self.play(
            f_face.animate.shift(DOWN * 0.12),
            f_lbl.animate.shift(DOWN * 0.12),
            f_bump.animate.shift(DOWN * 0.12),
            ripple_f.animate.scale(4.5).set_stroke(opacity=0),
            run_time=0.35,
            rate_func=rate_functions.ease_out_quad
        )
        self.play(
            f_face.animate.shift(UP * 0.12),
            f_lbl.animate.shift(UP * 0.12),
            f_bump.animate.shift(UP * 0.12).set_fill(color=EMERALD_GLOW),
            run_time=0.25
        )

        # SIMULATE TACTILE PRESS ON 'J':
        ripple_j = Circle(radius=0.2, color=EMERALD_GLOW, stroke_width=4, stroke_opacity=0.9).move_to(key_j_grp.get_center())
        self.add(ripple_j)
        new_cal_status = Text("ANCHOR KEYS CALIBRATED! ✓", font="sans-serif", weight=HEAVY, font_size=16, color=EMERALD_GLOW).move_to(cal_status_box.get_center())
        self.play(
            j_face.animate.shift(DOWN * 0.12),
            j_lbl.animate.shift(DOWN * 0.12),
            j_bump.animate.shift(DOWN * 0.12),
            ripple_j.animate.scale(4.5).set_stroke(opacity=0),
            run_time=0.35,
            rate_func=rate_functions.ease_out_quad
        )
        self.play(
            j_face.animate.shift(UP * 0.12),
            j_lbl.animate.shift(UP * 0.12),
            j_bump.animate.shift(UP * 0.12).set_fill(color=EMERALD_GLOW),
            Transform(cal_status_txt, new_cal_status),
            cal_status_box.animate.set_stroke(color=EMERALD, width=2.0),
            run_time=0.35
        )
        self.wait(1.0)

        # Transition out
        self.play(FadeOut(tut_scene, shift=RIGHT * 1.5), run_time=0.7)

        # ═════════════════════════════════════════════════════════════
        # 5. SCENE 4: DUAL THEME CONTRAST & CORNER HELP (19s - 25s)
        # ═════════════════════════════════════════════════════════════
        hud_tag = Text("FEATURE 03 // POLISHED DESIGN & UX", font="sans-serif", weight=BOLD, font_size=14, color=OCHRE)
        hud_tag.move_to(UP * 5.8)

        hud_heading = Text("Dual Themes &\nCorner Help Button", font="sans-serif", weight=HEAVY, font_size=34, color=LINEN_WHITE, line_spacing=1.1)
        hud_heading.next_to(hud_tag, DOWN, buff=0.25)

        # Bento Comparison: Organic Light vs Organic Dark
        card_light = RoundedRectangle(corner_radius=0.25, width=3.4, height=4.6, fill_color="#FAF8F5", fill_opacity=1.0, stroke_color="#D5CFC6", stroke_width=2)
        card_light.move_to(LEFT * 1.9 + UP * 0.5)
        lbl_light_theme = Text("ORGANIC LIGHT", font="sans-serif", weight=BOLD, font_size=13, color="#252B28").move_to(card_light.get_top() + DOWN * 0.45)
        sample_txt_light = Text("High-Contrast\nCharcoal Text\non Warm Linen", font="sans-serif", font_size=16, color="#2D3330", line_spacing=1.2).move_to(card_light.get_center())
        pill_fixed_1 = RoundedRectangle(corner_radius=0.12, width=2.4, height=0.45, fill_color="#EBE7DF", fill_opacity=1.0, stroke_color="#2D3330", stroke_width=1)
        pill_fixed_1.move_to(card_light.get_bottom() + UP * 0.6)
        pill_fixed_txt1 = Text("TEXT FIXED ✓", font="sans-serif", weight=BOLD, font_size=12, color="#2D3330").move_to(pill_fixed_1.get_center())
        theme_left = VGroup(card_light, lbl_light_theme, sample_txt_light, pill_fixed_1, pill_fixed_txt1)

        card_dark = RoundedRectangle(corner_radius=0.25, width=3.4, height=4.6, fill_color="#141716", fill_opacity=1.0, stroke_color=BORDER_FOCUS, stroke_width=2)
        card_dark.move_to(RIGHT * 1.9 + UP * 0.5)
        lbl_dark_theme = Text("ORGANIC DARK", font="sans-serif", weight=BOLD, font_size=13, color=TERRA_LIGHT).move_to(card_dark.get_top() + DOWN * 0.45)
        sample_txt_dark = Text("Luminous\nLinen Text\non Deep Basalt", font="sans-serif", font_size=16, color=LINEN_WHITE, line_spacing=1.2).move_to(card_dark.get_center())
        pill_fixed_2 = RoundedRectangle(corner_radius=0.12, width=2.4, height=0.45, fill_color="#24302A", fill_opacity=1.0, stroke_color=TERRACOTTA, stroke_width=1)
        pill_fixed_2.move_to(card_dark.get_bottom() + UP * 0.6)
        pill_fixed_txt2 = Text("TEXT FIXED ✓", font="sans-serif", weight=BOLD, font_size=12, color=TERRA_LIGHT).move_to(pill_fixed_2.get_center())
        theme_right = VGroup(card_dark, lbl_dark_theme, sample_txt_dark, pill_fixed_2, pill_fixed_txt2)

        # Corner Help Showcase Bar
        hud_bar_box = RoundedRectangle(corner_radius=0.25, width=7.2, height=1.6, fill_color=BG_ELEVATED, fill_opacity=0.95, stroke_color=BORDER_SUBTLE, stroke_width=2)
        hud_bar_box.move_to(DOWN * 3.0)

        nav_left_dummy = Text("ATI 3.1 • NAV", font="sans-serif", weight=BOLD, font_size=15, color=SAGE_LIGHT).move_to(hud_bar_box.get_left() + RIGHT * 1.3)
        
        # Corner Help Icon Button with pulsing beacon ring
        help_btn_circle = Circle(radius=0.45, color=TERRACOTTA, fill_color=TERRACOTTA, fill_opacity=0.25, stroke_width=2.5)
        help_btn_circle.move_to(hud_bar_box.get_right() + LEFT * 1.1)
        help_icon_lbl = Text("?", font="sans-serif", weight=HEAVY, font_size=24, color=TERRA_LIGHT).move_to(help_btn_circle.get_center())
        help_tooltip = Text("HELP MOVED TO CORNER", font="sans-serif", weight=BOLD, font_size=11, color=OCHRE).next_to(help_btn_circle, LEFT, buff=0.25)

        beacon_ring = Circle(radius=0.55, color=TERRA_LIGHT, stroke_width=2.5, stroke_opacity=0.8).move_to(help_btn_circle.get_center())
        hud_showcase = VGroup(hud_bar_box, nav_left_dummy, help_btn_circle, help_icon_lbl, help_tooltip, beacon_ring)

        scene_themes = VGroup(hud_tag, hud_heading, theme_left, theme_right, hud_showcase)
        self.play(FadeIn(scene_themes, shift=UP * 0.4), run_time=0.9)

        # Pulse beacon on Help Button
        self.play(
            beacon_ring.animate.scale(1.8).set_stroke(opacity=0),
            help_btn_circle.animate.set_fill(TERRACOTTA, opacity=0.6),
            run_time=0.8,
            rate_func=rate_functions.ease_out_quad
        )
        self.wait(1.2)

        self.play(FadeOut(scene_themes, scale=0.9), run_time=0.7)

        # ═════════════════════════════════════════════════════════════
        # 6. SCENE 5: OUTRO & CALL TO ACTION (25s - 30s)
        # ═════════════════════════════════════════════════════════════
        outro_badge = RoundedRectangle(corner_radius=0.2, width=3.6, height=0.6, fill_color=EMERALD, fill_opacity=0.3, stroke_color=EMERALD, stroke_width=2)
        outro_badge.move_to(UP * 4.2)
        outro_badge_txt = Text("AVAILABLE NOW", font="sans-serif", weight=BOLD, font_size=18, color=EMERALD_GLOW).move_to(outro_badge.get_center())

        outro_title = Text("UPGRADE TO\nATI 3.1.0", font="sans-serif", weight=HEAVY, font_size=44, color=LINEN_WHITE, line_spacing=1.1)
        outro_title.next_to(outro_badge, DOWN, buff=0.45)

        # Checklist of New Features in a Bento Box
        checklist_box = RoundedRectangle(corner_radius=0.3, width=7.2, height=4.6, fill_color=BG_SURFACE, fill_opacity=0.95, stroke_color=BORDER_SUBTLE, stroke_width=2)
        checklist_box.move_to(DOWN * 0.6)

        items = [
            "✓ Multi-Mode Daily Challenge (Words/Sentences/Paras)",
            "✓ Interactive F & J Finger Placement Calibration",
            "✓ Instant Skip Tutorial Button",
            "✓ Organic Dual Themes (Light & Dark High Contrast)",
            "✓ Repositioned Corner Help Navigation",
            "✓ Standalone Windows Executable (.EXE)"
        ]
        item_mobjects = []
        for i, itm in enumerate(items):
            color = EMERALD_GLOW if i == 0 else (OCHRE if i == 1 else LINEN_WHITE)
            t = Text(itm, font="sans-serif", weight=SEMIBOLD, font_size=15, color=color)
            t.move_to(checklist_box.get_top() + DOWN * (0.65 + i * 0.65))
            item_mobjects.append(t)
        checklist_items = VGroup(*item_mobjects)

        cta_pill = RoundedRectangle(corner_radius=0.25, width=6.5, height=0.95, fill_color=TERRACOTTA, fill_opacity=1.0, stroke_color=TERRA_LIGHT, stroke_width=2)
        cta_pill.move_to(DOWN * 4.2)
        cta_txt = Text("DOWNLOAD & PLAY TODAY", font="sans-serif", weight=HEAVY, font_size=20, color=LINEN_WHITE).move_to(cta_pill.get_center())
        cta_group = VGroup(cta_pill, cta_txt)

        outro_group = VGroup(outro_badge, outro_badge_txt, outro_title, checklist_box, checklist_items, cta_group)
        self.play(GrowFromCenter(outro_group), run_time=1.0)
        self.wait(2.2)
        self.play(FadeOut(outro_group, scale=1.05), run_time=0.8)
