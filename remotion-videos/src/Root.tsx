import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { ShortsComposition } from "./ShortsVideo";
import { ShowcaseComposition } from "./ShowcaseVideo";
import { GameplayComposition } from "./GameplayVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. YouTube Shorts Video (9:16 Vertical Format, 30s) */}
      <Composition
        id="ShortsVideo"
        component={ShortsComposition}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 2. Feature Showcase Video (16:9 Landscape Format) */}
      <Composition
        id="ShowcaseVideo"
        component={ShowcaseComposition}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 3. ATI Gameplay Showcase — YouTube Shorts (9:16, 60fps, 60s) */}
      <Composition
        id="ATIGameplayShowcase"
        component={GameplayComposition}
        durationInFrames={3600}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
