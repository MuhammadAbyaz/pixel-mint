"use client";
import React, { useState } from "react";

type MediaItem = {
  title: string;
  artist: string;
  img: string;
  aspect?: string;
};

const categories = [
  "All Categories",
  "Art",
  "Collectibles",
  "Photography",
  "Virtual Worlds",
  "Sports",
];

const trending: MediaItem[] = [
  {
    title: "Cosmic Odyssey",
    artist: "Alpha Creator",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDS6wZqiv-q698eMUlIwun8SuqFNDqGczOVD3INx8lkvoNUeo6g_sZgXqUMa0gqf7705pXAdRO077HSUdQ0td8I9OSlj4FYXwqhjsa88UH1rMwbJZKGvpXxqy5Tj1IgaVYfhE4PiEl_PARSjQnHW6XKZ4HfykPpF2LclkVMtgAjHpXtJQg0iQNaafvUprjC4utHuqWZ4bIhOEgNDyAwlUM-U0VqwGCeJZh8AlakPxwuTfG_fqKNVcGKYAluTSMJjEjEAaUjChKaWME",
  },
  {
    title: "Future Funk",
    artist: "Beta Collective",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmQyEm4v8WWYhRrl5ERxMZh_PGFp7_Jd_qwYhd_lnjlvOImhWxyIMUsgWcol-vcdb3unqLIhB9rPoF_YPNL0xBjsSXt9OKnEsexrJckVGGLMxHUmjtXoGWAON_-tZMP-Cq67S8jazT7crEbpFPPenrZwb4z-p3vcN1Z0B6LoLYIOvny5jchAthX85OnuEr6BSXaNX4HQyhGLNTNtjt9MwJSYMTQYLkpwkk0Y3lkU4sYYZ2gRHx1baTvi7V40P2QkONgKysJ7-Zgmg",
  },
  {
    title: "Geometric Dreams",
    artist: "Gamma Artist",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhwj7n_rZpLWjEwunBS9qBbzy07TEEY9cPQC2Wg2TGyz8BAW14TFMi0tMc4Gvki3FVwz8JsNpU9bGPpfik9GpwoWLgMxK8g7SxXhrCRmO72H_GebrhQ_J1QSvpSpMWPMBbs_MdL0M_xyyoJAqn3KlZH87ZWYH5sWNLspftseO33CM51P623pH48vFPXXdagpbUgif417IiT0qRF4GxpUHM2z6W0QAEpMwTvztUo_G7arhJj7jwpWiXu4wHgjUe-rxU_di8e5tTLoA",
  },
  {
    title: "Pixel Perfect",
    artist: "Delta Designs",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgpUju00ASHaga2nIysKMtUFqGtb0TdQBwleaXt52W67nl_mTWccPgewLent_S3_cYy1elcRIYckCYA3mm_AX4Gj1QlckSdhnlWUpPowWWnG4ef2fJ0BOMGoITX8zEIEEcIsnB7wTmy20mU125Y7rFry1FReuWj7dlB8XumyS20xV3aO1XWbr5mFi2bsThwqMqU_n9LA_deLP8KOnRgB7fE5s29zqdN3WkCv_Z0N7bf4Di4cGyo9cMbIwaFG4N9sV2WgYIiLR2LL8",
  },
];

const newArrivals: MediaItem[] = [
  {
    title: "Oceanic Whispers",
    artist: "Epsilon Studios",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2yB5f8k2t_XzC7f7j3c8d3k9k9Z4u4Z1d2c6c3e9a5d7c8b9a1c4b7e8d9c8b7a6e5d4c3b2a1",
    aspect: "aspect-[4/3]",
  },
  {
    title: "Forest Spirit",
    artist: "Zeta Innovations",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3yB5f8k2t_XzC7f7j3c8d3k9k9Z4u4Z1d2c6c3e9a5d7c8b9a1c4b7e8d9c8b7a6e5d4c3b2a1",
    aspect: "aspect-[4/3]",
  },
  {
    title: "Urban Jungle",
    artist: "Eta Creations",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuE2yB5f8k2t_XzC7f7j3c8d3k9k9Z4u4Z1d2c6c3e9a5d7c8b9a1c4b7e8d9c8b7a6e5d4c3b2a1",
    aspect: "aspect-[4/3]",
  },
  {
    title: "Celestial Bodies",
    artist: "Theta Labs",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuF3yB5f8k2t_XzC7f7j3c8d3k9k9Z4u4Z1d2c6c3e9a5d7c8b9a1c4b7e8d9c8b7a6e5d4c3b2a1",
    aspect: "aspect-[4/3]",
  },
];

const editorsPicks: MediaItem[] = [
  {
    title: "Ephemeral Beauty",
    artist: "Iota Arts",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuG2yB5f8k2t_XzC7f7j3c8d3k9k9Z4u4Z1d2c6c3e9a5d7c8b9a1c4b7e8d9c8b7a6e5d4c3b2a1",
    aspect: "aspect-video",
  },
  {
    title: "Glitch in the Matrix",
    artist: "Kappa Visuals",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuH3yB5f8k2t_XzC7f7j3c8d3k9k9Z4u4Z1d2c6c3e9a5d7c8b9a1c4b7e8d9c8b7a6e5d4c3b2a1",
    aspect: "aspect-video",
  },
  {
    title: "Retro Fusion",
    artist: "Lambda Foundry",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuI2yB5f8k2t_XzC7f7j3c8d3k9k9Z4u4Z1d2c6c3e9a5d7c8b9a1c4b7e8d9c8b7a6e5d4c3b2a1",
    aspect: "aspect-video",
  },
];

function MarketPlace() {
  const [activeCategory, setActiveCategory] = useState("All Categories");

  return (
    <div
      className="relative flex min-h-screen w-full flex-col bg-[#111111] overflow-x-hidden"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="px-4 py-8 md:py-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover, Collect, and Sell
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              The premier marketplace for unique digital art and collectibles.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
              {categories.map((c) => {
                const active = c === activeCategory;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={
                      `px-4 py-2 rounded-md font-medium transition-colors ` +
                      (active
                        ? "text-white bg-[var(--primary-color,#3713ec)]"
                        : "text-gray-300 bg-gray-800 hover:bg-gray-700")
                    }
                    aria-pressed={active}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trending NFTs */}
          <section className="py-12" aria-labelledby="trending-heading">
            <h3
              id="trending-heading"
              className="text-white text-3xl font-bold leading-tight tracking-tight px-4 pb-6"
            >
              Trending NFTs
            </h3>
            <div className="relative">
              <div
                className="flex overflow-x-auto gap-6 px-4 pb-4 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="list"
                aria-label="Trending NFTs list"
              >
                {trending.map((item) => (
                  <div
                    key={item.title}
                    className="group flex flex-col gap-4 rounded-lg min-w-72 bg-gray-800/50 p-4 transition-all hover:bg-gray-800 hover:shadow-2xl hover:shadow-purple-500/10"
                  >
                    <div className="w-full aspect-square rounded-md overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="text-white text-lg font-bold leading-normal">
                        {item.title}
                      </p>
                      <p className="text-gray-400 text-base leading-normal">
                        By {item.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* New Arrivals */}
          <section className="py-12" aria-labelledby="new-arrivals-heading">
            <h3
              id="new-arrivals-heading"
              className="text-white text-3xl font-bold leading-tight tracking-tight px-4 pb-6"
            >
              New Arrivals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
              {newArrivals.map((item) => (
                <div
                  key={item.title}
                  className="group flex flex-col gap-3 pb-3 rounded-lg overflow-hidden bg-gray-800/50 transition-all hover:bg-gray-800 hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div
                    className={`w-full ${item.aspect ?? "aspect-square"} bg-center bg-no-repeat bg-cover overflow-hidden`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-white text-lg font-bold leading-normal">
                      {item.title}
                    </p>
                    <p className="text-gray-400 text-sm">By {item.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Editor's Picks */}
          <section className="py-12" aria-labelledby="editors-picks-heading">
            <h3
              id="editors-picks-heading"
              className="text-white text-3xl font-bold leading-tight tracking-tight px-4 pb-6"
            >
              Editor&apos;s Picks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
              {editorsPicks.map((item) => (
                <div
                  key={item.title}
                  className="group flex flex-col gap-4 rounded-lg bg-gray-800/50 p-4 transition-all hover:bg-gray-800 hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div
                    className={`w-full ${item.aspect ?? "aspect-video"} rounded-md overflow-hidden`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="text-white text-xl font-bold leading-normal">
                      {item.title}
                    </p>
                    <p className="text-gray-400 text-base leading-normal">
                      By {item.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default MarketPlace;
