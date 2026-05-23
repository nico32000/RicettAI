"use client";

import { useState, useEffect } from "react";

interface Recipe {
  id: string;
  title: string;
  difficulty: string;
  finalPoints: number;
  prepMinutes: number;
  cookMinutes: number;
  status: string;
  createdAt: string;
}

export function useRecentRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(data.recipes ?? []))
      .catch(() => setError("Errore nel caricamento"))
      .finally(() => setIsLoading(false));
  }, []);

  function removeRecipe(id: string) {
    setRecipes(prev => prev.filter(r => r.id !== id));
  }

  return { recipes, isLoading, error, setRecipes, removeRecipe };
}