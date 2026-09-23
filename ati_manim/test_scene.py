from manim import *

class TestScene(Scene):
    def construct(self):
        c = Circle(color="#C97D5A", fill_opacity=0.8)
        self.play(Create(c), run_time=0.5)
        self.wait(0.5)
