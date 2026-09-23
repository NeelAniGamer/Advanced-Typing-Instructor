from manim import *

class ImageTest(Scene):
    def construct(self):
        img = ImageMobject(r"c:\Users\neelg\OneDrive\Desktop\CoL Project\Current Projects\Current Working Apps\ATI 1.4\public\screenshots\organic_light_dashboard.png")
        img.scale_to_fit_width(6)
        self.play(FadeIn(img), run_time=0.5)
        self.wait(0.5)
