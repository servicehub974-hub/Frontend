"use client";

import { useState } from "react";
import { CategoryPills } from "@/components/home/category-pills";
import { HeroPoster } from "@/components/home/hero-poster";
import { ContentFeed } from "@/components/home/content-feed";

export default function HomePage() {
  const [category, setCategory] = useState("All Universe");

  return (
    <>
      <CategoryPills active={category} onChange={setCategory} />

      <div className="relative z-0 mx-auto -mt-2 w-full max-w-[2400px] flex-1 px-4 sm:px-6 md:px-8">
        {category === "All Universe" && <HeroPoster />}
        <ContentFeed category={category} />
      </div>
    </>
  );
}
