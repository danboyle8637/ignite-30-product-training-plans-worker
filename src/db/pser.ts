export const getPserWeekQuery = `
  {
    "pserWeekData": *[
      _type == "collection" &&
      program -> programId == $programId] {
      "cardData": {
        "id": _id,
        "slug": slug.current,
        "cardImageUrl": collectionCardImage.mainImage.asset->url,
        "cardImageAltTag": collectionCardImage.imageAltTag,
        "cardImageTitleTag": collectionCardImage.imageTitleTag,
        "cardTitle": title,
        "cardDescription": shortDescription,
      },
      "recipes": recipeCollection[]-> {
        "id": _id,
        "type": recipeType,
        "title": title,
        "cardImageUrl": recipeImage.mainImage.asset->url,
        "cardImageAltTag": recipeImage.imageAltTag,
        "cardImageTitleTag": recipeImage.imageTitleTag,
        "cardImageWidth": recipeImage.imageWidth,
        "cardImageHeight": recipeImage.imageHeight,
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat,
        "directions": directions,
        "ingredients": ingredients,
        "recipeNotes": notes,
      }
    }
  }
`;

export const getPserWeekCardsQuery = `
  {
    "pserWeekCardsData": *[
      _type == "collection" &&
      program -> programId == "pser"] | order(order asc) {
        "id": _id,
        "order": order,
        "cardImage": collectionCardImage.mainImage.asset->url,
        "cardImageAltTag": collectionCardImage.imageAltTag,
        "cardImageTitleTag": collectionCardImage.imageTitleTag,
        "cardTitle": cardTitle,
        "cardDescription": shortDescription,
        "weekSlug": slug.current,
      }
  }
`;

export const getPserWeekRecipesDataQuery = `
   {
    "pserWeekRecipesData": *[
      _type == "collection" &&
      program -> programId == $programId && order == $order][0] {
      "recipes": recipeCollection[]-> {
        "id": _id,
        "type": recipeType,
        "title": title,
        "cardImageUrl": recipeImage.mainImage.asset->url,
        "cardImageAltTag": recipeImage.imageAltTag,
        "cardImageTitleTag": recipeImage.imageTitleTag,
        "cardImageWidth": recipeImage.imageWidth,
        "cardImageHeight": recipeImage.imageHeight,
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat,
        "directions": directions,
        "ingredients": ingredients,
        "recipeNotes": notes,
      }
    }
  }
`;
