"use client";
import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Image constants from Figma
const imgRectangle30 =
  "https://www.figma.com/api/mcp/asset/05981f32-0f8e-4cc0-afab-2fc55ad51a10";
const imgImage4 =
  "https://www.figma.com/api/mcp/asset/c5ae3306-d345-4a71-854f-870db58c9270";
const imgRectangle21 =
  "https://www.figma.com/api/mcp/asset/290d9a86-58d7-4649-bf4b-93ad43f0e7a5";
const imgRectangle22 =
  "https://www.figma.com/api/mcp/asset/99135f24-1ded-425f-873a-afc29972f77d";
const imgRectangle23 =
  "https://www.figma.com/api/mcp/asset/d50cd175-9f32-428a-876e-516e204b8ed2";
const imgRectangle24 =
  "https://www.figma.com/api/mcp/asset/ce9a5621-cbe2-486a-ac9b-55079c74c300";
const imgRectangle25 =
  "https://www.figma.com/api/mcp/asset/feb833e1-fb28-4617-adf2-23abc1f230dc";
const imgRectangle29 =
  "https://www.figma.com/api/mcp/asset/302ca120-86bf-4424-aa31-89a4260d09d6";
const imgRectangle26 =
  "https://www.figma.com/api/mcp/asset/a7d9eba4-cb3c-4e45-a51d-9c5274788fc7";
const imgRectangle28 =
  "https://www.figma.com/api/mcp/asset/55f0f5b7-ecd0-4d58-8b5c-f8d80bb3858b";

type Creator = {
  name: string;
  popularity: string;
  collections: string;
  avatar: string;
  verified?: boolean;
  slug: string;
};

type Collection = {
  name: string;
  floorPrice: string;
  image: string;
  slug: string;
};

type HeroSlide = {
  title: string;
  creator: string;
  image: string;
};

const heroSlides: HeroSlide[] = [
  {
    title: "Abstract Designs",
    creator: "Muhammad Abyaz",
    image: imgRectangle30,
  },
  {
    title: "Digital Dreamscapes",
    creator: "Muhammad Awwab",
    image: imgRectangle22,
  },
  {
    title: "Cosmic Visions",
    creator: "S.M. Rayyan",
    image: imgRectangle23,
  },
  {
    title: "Nature's Canvas",
    creator: "Rashid Ismail",
    image: imgRectangle24,
  },
];

const creators: Creator[] = [
  {
    name: "Muhammad Abyaz",
    popularity: "1 Million",
    collections: "25K",
    avatar: imgRectangle26,
    verified: true,
    slug: "muhammad-abyaz",
  },
  {
    name: "Muhammad Awwab",
    popularity: "500K",
    collections: "10K",
    avatar: imgRectangle25,
    verified: true,
    slug: "muhammad-awwab",
  },
  {
    name: "S.M. Rayyan",
    popularity: "250K",
    collections: "5K",
    avatar: imgRectangle29,
    verified: true,
    slug: "sm-rayyan",
  },
  {
    name: "Rashid Ismail",
    popularity: "100K",
    collections: "2.5K",
    avatar: imgRectangle28,
    verified: true,
    slug: "rashid-ismail",
  },
];

const collections: Collection[] = [
  {
    name: "Abstractions",
    floorPrice: "$250",
    image: imgRectangle21,
    slug: "abstractions",
  },
  {
    name: "Sentinels of Light (Bundle)",
    floorPrice: "$150",
    image: imgRectangle22,
    slug: "sentinels-of-light",
  },
  {
    name: "Digital Arts",
    floorPrice: "$80",
    image: imgRectangle23,
    slug: "digital-arts",
  },
  {
    name: "Natural Beauty",
    floorPrice: "$100",
    image: imgRectangle24,
    slug: "natural-beauty",
  },
];

function MarketPlace() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-background">
      <main className="px-4 sm:px-8 lg:px-[52px] pt-[102px]">
        {/* Filter buttons and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-[51px] items-start sm:items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex gap-[6px] flex-wrap">
            <button
              onClick={() => setActiveFilter("All")}
              className={`h-10 px-4 rounded-lg border border-border font-semibold text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "All"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("Gaming")}
              className={`h-10 px-4 rounded-lg border border-border font-medium text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "Gaming"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              Gaming
            </button>
            <button
              onClick={() => setActiveFilter("Art")}
              className={`h-10 px-4 rounded-lg border border-border font-medium text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "Art"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              Art
            </button>
            <button
              onClick={() => setActiveFilter("More")}
              className={`h-10 px-4 rounded-lg border border-border font-medium text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "More"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              More
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-[497px]">
            <div className="h-10 rounded-lg bg-card border border-border flex items-center px-4 gap-2 transition-all duration-300 hover:border-foreground/50 focus-within:border-foreground/70">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Collections Or Creators"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Hero Banner Carousel */}
        <div className="relative h-[305px] sm:h-[557px] rounded-[20px] overflow-hidden mb-[117px] group">
          {/* Carousel Images */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentSlide
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-105"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
          ))}

          {/* Content */}
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-10">
            <h1 className="text-foreground text-2xl sm:text-3xl font-semibold mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {heroSlides[currentSlide]?.title}
            </h1>
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <p className="text-foreground text-base sm:text-lg font-medium">
                by {heroSlides[currentSlide]?.creator}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgImage4}
                alt="Verified"
                className="w-[24px] h-[24px] sm:w-[33px] sm:h-[33px] rounded-full"
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/70 text-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/70 text-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? "bg-foreground w-8 h-2"
                    : "bg-foreground/50 w-2 h-2 hover:bg-foreground/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trending Creators */}
        <section className="mb-[153px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold mb-12">
            Trending Creators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[15px]">
            {creators.map((creator, index) => (
              <Link
                href={`/creator/${creator.slug}`}
                key={index}
                className="bg-card border border-border rounded-[20px] h-[98px] flex items-center gap-4 px-4 transition-all duration-300 hover:scale-105 hover:border-foreground/50 hover:shadow-lg hover:shadow-foreground/10 cursor-pointer group"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-[64px] h-[64px] rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-foreground text-sm font-semibold truncate">
                      {creator.name}
                    </p>
                    {creator.verified && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imgImage4}
                        alt="Verified"
                        className="w-[24px] h-[24px] rounded-full flex-shrink-0"
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs transition-colors group-hover:text-foreground/70">
                    Popularity: {creator.popularity}
                  </p>
                  <p className="text-muted-foreground text-xs transition-colors group-hover:text-foreground/70">
                    Total Collections: {creator.collections}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Collections */}
        <section className="pb-[100px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold mb-12">
            Trending Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[13px]">
            {collections.map((collection, index) => (
              <Link
                href={`/collection/${collection.slug}`}
                key={index}
                className="border border-border rounded-[20px] overflow-hidden bg-card transition-all duration-300 hover:scale-105 hover:border-foreground/50 hover:shadow-lg hover:shadow-foreground/10 cursor-pointer group"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="relative h-[165px] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <p className="text-foreground text-sm font-semibold mb-1 transition-colors group-hover:text-foreground">
                    {collection.name}
                  </p>
                  <p className="text-muted-foreground text-xs transition-colors group-hover:text-foreground/70">
                    Floor price: {collection.floorPrice}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default MarketPlace;
