import "./index.css";
import { Composition } from "remotion";
import { ShortsComposition } from "./ShortsVideo";
import { ShowcaseComposition } from "./ShowcaseVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. YouTube Shorts Video (9:16 Vertical Format) */}
      <Composition
        id="ShortsVideo"
        component={ShortsComposition}
        durationInFrames={450}
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
    </>
  );
};
