export type CategorySubcategoryInput = {
  id: string;
  name: string;
  keywords?: string[];
};

export type CategoryInput = {
  categoryId: string;
  name: string;
  subcategoriesJson?: CategorySubcategoryInput[];
  keywordsJson?: string[];
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreKeywords(text: string, keywords: string[]): number {
  const haystack = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    const needle = keyword.trim().toLowerCase();
    if (!needle) continue;
    if (haystack.includes(needle)) score += 2;
  }
  return score;
}

function scoreSubcategory(message: string, subcategory: CategorySubcategoryInput): number {
  let score = scoreKeywords(message, subcategory.keywords ?? []);
  const tokens = tokenize(message);
  const haystack = [subcategory.id, subcategory.name].join(" ").toLowerCase();
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

export async function inferCategory(
  firstMessage: string,
  categories: CategoryInput[],
): Promise<{ categoryId: string | null; subcategoryId: string | null; confidence: number }> {
  const trimmed = firstMessage.trim();
  if (!trimmed || !categories.length) {
    return { categoryId: null, subcategoryId: null, confidence: 0 };
  }

  let best: { categoryId: string; subcategoryId: string; confidence: number } | null = null;

  for (const category of categories) {
    const segmentKeywords = category.keywordsJson ?? [];
    const segmentScore = scoreKeywords(trimmed, segmentKeywords);
    const subcategories = category.subcategoriesJson ?? [];

    if (subcategories.length) {
      for (const subcategory of subcategories) {
        const score = segmentScore + scoreSubcategory(trimmed, subcategory);
        if (
          !best ||
          score > best.confidence ||
          (score === best.confidence &&
            `${category.categoryId}/${subcategory.id}`.localeCompare(
              `${best.categoryId}/${best.subcategoryId}`,
            ) < 0)
        ) {
          best = {
            categoryId: category.categoryId,
            subcategoryId: subcategory.id,
            confidence: score,
          };
        }
      }
      continue;
    }

    const score = segmentScore + scoreSubcategory(trimmed, {
      id: category.categoryId,
      name: category.name,
      keywords: segmentKeywords,
    });
    if (!best || score > best.confidence) {
      best = {
        categoryId: category.categoryId,
        subcategoryId: category.categoryId,
        confidence: score,
      };
    }
  }

  if (!best || best.confidence < 3) {
    return {
      categoryId: null,
      subcategoryId: null,
      confidence: best?.confidence ?? 0,
    };
  }

  return best;
}
