"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useHomeHeroMotion(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const hero = root;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stage = root.querySelector<HTMLElement>("[data-hero-stage]");
      const parallax = root.querySelector<HTMLElement>("[data-hero-parallax]");
      const assembly = root.querySelector<SVGGElement>("[data-hero-assembly]");
      const layers = root.querySelectorAll<SVGGElement>("[data-hero-layer]");
      const route = root.querySelector<SVGPathElement>("[data-hero-route]");
      const nodes = root.querySelector<SVGGElement>("[data-hero-nodes]");
      const copy = root.querySelector<HTMLElement>("[data-hero-copy]");

      if (!stage || !parallax || !assembly || !route || !copy) return;

      if (reduced) {
        root.dataset.motionState = "reduced";
        gsap.set(route, { strokeDashoffset: 0 });
        return;
      }

      root.dataset.motionState = "entering";
      const entrance = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          root.dataset.motionState = "idle";
        },
      });

      entrance
        .fromTo(stage, { autoAlpha: 0.72, scale: 1.035, y: 22 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.25 }, 0)
        .fromTo(assembly, { scale: 0.965, y: 16 }, { scale: 1, y: 0, duration: 1.55 }, 0.05)
        .fromTo(
          layers,
          { x: (index) => [18, -12, 10][index] ?? 0, y: (index) => [-14, 8, 18][index] ?? 0, rotation: (index) => [-1.4, 0.8, -0.6][index] ?? 0, opacity: 0.45 },
          { x: 0, y: 0, rotation: 0, opacity: 1, duration: 1.5, stagger: 0.08 },
          0.08,
        )
        .fromTo(route, { strokeDashoffset: 1, opacity: 0.25 }, { strokeDashoffset: 0, opacity: 1, duration: 1.55, ease: "power2.inOut" }, 0.35)
        .fromTo(nodes, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.8)" }, 1.05)
        .fromTo(copy, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.85 }, 1.15);

      const pulse = gsap.timeline({ repeat: -1, repeatDelay: 4.8, delay: 2.6 });
      pulse.to(route, { opacity: 0.45, duration: 0.35, ease: "sine.inOut" }).to(route, { opacity: 1, duration: 0.65, ease: "sine.out" });

      const exit = gsap.to(stage, {
        y: -36,
        scale: 0.965,
        opacity: 0.72,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top+=68",
          end: "bottom top+=180",
          scrub: 0.65,
          onEnter: () => {
            root.dataset.motionState = "exiting";
          },
          onLeaveBack: () => {
            root.dataset.motionState = entrance.progress() === 1 ? "idle" : "entering";
          },
        },
      });

      const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (!canHover) return () => {
        entrance.kill();
        pulse.kill();
        exit.kill();
      };

      const xTo = gsap.quickTo(parallax, "x", { duration: 0.8, ease: "power3.out" });
      const yTo = gsap.quickTo(parallax, "y", { duration: 0.8, ease: "power3.out" });
      const rotateXTo = gsap.quickTo(parallax, "rotationX", { duration: 0.9, ease: "power3.out" });
      const rotateYTo = gsap.quickTo(parallax, "rotationY", { duration: 0.9, ease: "power3.out" });

      function handlePointerMove(event: PointerEvent) {
        const bounds = hero.getBoundingClientRect();
        const nx = (event.clientX - bounds.left) / bounds.width - 0.5;
        const ny = (event.clientY - bounds.top) / bounds.height - 0.5;
        xTo(nx * 6);
        yTo(ny * 6);
        rotateXTo(ny * -0.6);
        rotateYTo(nx * 0.6);
      }

      function handlePointerLeave() {
        xTo(0);
        yTo(0);
        rotateXTo(0);
        rotateYTo(0);
      }

      root.addEventListener("pointermove", handlePointerMove);
      root.addEventListener("pointerleave", handlePointerLeave);

      return () => {
        root.removeEventListener("pointermove", handlePointerMove);
        root.removeEventListener("pointerleave", handlePointerLeave);
        entrance.kill();
        pulse.kill();
        exit.kill();
      };
    },
    { scope: rootRef },
  );
}
