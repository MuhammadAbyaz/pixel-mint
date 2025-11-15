"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ---------------- Types ----------------
type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

// ---------------- Dot Matrix Shader Implementation ----------------

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string; // configuration string flags (reverse etc.)
  center?: ("x" | "y")[];
  animationSpeed?: number; // new dynamic speed (higher = faster)
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
  animationSpeed = 3,
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => {
          const safe: number[] = color ?? [0, 0, 0];
          const [r = 0, g = 0, b = 0] = safe;
          return [r / 255, g / 255, b / 255];
        }),
        type: "uniform3fv" as const,
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
      u_reverse: {
        value: shader.includes("u_reverse_active") ? 1 : 0,
        type: "uniform1i",
      },
      u_anim_speed: {
        // Normalise a little so large numbers don't explode the animation
        value: animationSpeed * 0.5, // tune factor if desired
        type: "uniform1f",
      },
    } as Uniforms;
  }, [colors, opacities, totalSize, dotSize, shader, animationSpeed]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;
  uniform float u_time; uniform float u_opacities[10]; uniform vec3 u_colors[6];
  uniform float u_total_size; uniform float u_dot_size; uniform vec2 u_resolution; uniform int u_reverse; uniform float u_anim_speed;
        out vec4 fragColor; float PHI = 1.61803398874989484820459;
        float random(vec2 xy){ return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }
        void main(){ vec2 st = fragCoord.xy;
          ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
          ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}
          float opacity = step(0.0, st.x); opacity *= step(0.0, st.y);
          vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
          float frequency = 5.0; float show_offset = random(st2);
          float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
          opacity *= u_opacities[int(rand * 10.0)];
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
          vec3 color = u_colors[int(show_offset * 6.0)];
          float animation_speed_factor = u_anim_speed; // dynamic speed
          vec2 center_grid = u_resolution / 2.0 / u_total_size;
          float dist_from_center = distance(center_grid, st2);
          float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
          float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
          float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);
          float current_timing_offset = u_reverse == 1 ? timing_offset_outro : timing_offset_intro;
          if (u_reverse == 1) {
            opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
          } else {
            opacity *= step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
          }
          fragColor = vec4(color, opacity); fragColor.rgb *= fragColor.a; }
      `}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

// ---------------- Low-level Shader wrappers ----------------

interface ShaderMaterialImplProps {
  source: string;
  uniforms: Uniforms;
}

const ShaderMaterialImpl: React.FC<ShaderMaterialImplProps> = ({
  source,
  uniforms,
}) => {
  const { size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  // Prepare uniforms once per dependency set
  const material = useMemo(() => {
    const prepared: Record<string, THREE.IUniform> = {};
    for (const name in uniforms) {
      const u = uniforms[name];
      if (!u) continue;
      switch (u.type) {
        case "uniform1f":
        case "uniform1i":
          prepared[name] = { value: u.value as number };
          break;
        case "uniform1fv":
          prepared[name] = { value: u.value as number[] };
          break;
        case "uniform3fv":
          prepared[name] = {
            value: (u.value as number[][]).map((v) =>
              new THREE.Vector3().fromArray(v),
            ),
          };
          break;
        default:
          break;
      }
    }
    prepared.u_time = { value: 0 };
    prepared.u_resolution = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        uniform vec2 u_resolution; out vec2 fragCoord; void main(){
          gl_Position = vec4(position.xy, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution; fragCoord.y = u_resolution.y - fragCoord.y; }
      `,
      fragmentShader: source,
      uniforms: prepared,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      transparent: true,
    });
  }, [size.width, size.height, source, uniforms]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.ShaderMaterial | undefined;
    if (!mat) return;
    const uniformsObj = mat.uniforms as
      | Record<string, THREE.IUniform>
      | undefined;
    if (!uniformsObj || !uniformsObj.u_time) return;
    uniformsObj.u_time.value = clock.getElapsedTime();
    if (uniformsObj.u_resolution?.value instanceof THREE.Vector2) {
      const res = uniformsObj.u_resolution.value;
      const targetW = size.width * 2;
      const targetH = size.height * 2;
      if (res.x !== targetW || res.y !== targetH) {
        uniformsObj.u_resolution.value = new THREE.Vector2(targetW, targetH);
      }
    }
  });

  // Attach geometry & material once
  React.useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry = new THREE.PlaneGeometry(2, 2);
      meshRef.current.material = material;
    }
  }, [material]);

  return <mesh ref={meshRef} />;
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMaterialImpl source={source} uniforms={uniforms} />
  </Canvas>
);

// ---------------- Public Component ----------------

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities}
          shader={` ${reverse ? "u_reverse_active" : "false"}_;`}
          center={["x", "y"]}
          animationSpeed={animationSpeed}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      )}
    </div>
  );
};
