export const getRapidRecoveryWeekQuery = `
  {
    "rapidRecoveryWeekData": *[
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
      "videoSession": videoCollection[]-> {
        "id": _id,
        "videoType": video.videoType,
        "videoHost": video.videoHost,
        "videoTitle": video.title,
        "videoId": video.videoId,
        "sessionWorkoutDetails": video.videoDiscussion,
      },
      "exercises": exerciseCollection[]-> {
        "id": _id,
        "type": exerciseType,
        "title": title,
        "description": shortDescription,
        "cardImageUrl": exerciseImage.mainImage.asset->url,
        "cardImageAltTag": exerciseImage.imageAltTag,
        "cardImageTitleTag": exerciseImage.imageTitleTag,
        "cardImageWidth": exerciseImage.imageWidth,
        "cardImageHeight": exerciseImage.imageHeight,
        "breakdown": description,
      }
    }
  }
`;

export const getAllRapidRecoveryWeekCardsQuery = `
  {
    "rapidRecoveryWeekCardsData": *[
      _type == "collection" && 
      program -> programId == "rapid_recovery"] {
        "id": _id,
        "order": order,
        "cardImage": collectionCardImage.mainImage.asset->url,
        "cardImageAltTag": collectionCardImage.imageAltTag,
        "cardImageTitleTag": collectionCardImage.imageTitleTag,
        "cardTitle": title,
        "cardDescription": shortDescription,
      }
  }
`;

export const getRapidRecoveryWeekSessionData = `
   {
    "rapidRecoveryWeekData": *[
      _type == "collection" && 
      program -> programId == $programId && order == $order][0] {
      "videoSession": videoCollection[]-> {
        "id": _id,
        "order": video.order,
        "videoType": video.videoType,
        "videoHost": video.videoHost,
        "videoTitle": video.title,
        "videoId": video.videoId,
        "sessionWorkoutDetails": video.videoDiscussion,
      },
      "exercises": exerciseCollection[]-> {
        "id": _id,
        "type": exerciseType,
        "title": title,
        "description": shortDescription,
        "cardImageUrl": exerciseImage.mainImage.asset->url,
        "cardImageAltTag": exerciseImage.imageAltTag,
        "cardImageTitleTag": exerciseImage.imageTitleTag,
        "cardImageWidth": exerciseImage.imageWidth,
        "cardImageHeight": exerciseImage.imageHeight,
        "breakdown": description,
      }
    }
  }
`;

export const rapidRecoveryWeekData = `
  {
    "videoSession": videoCollection[]-> {
      "id": _id,
      "videoType": video.videoType,
      "videoHost": video.videoHost,
      "videoTitle": video.title,
      "videoId": video.videoId,
      "sessionWorkoutDetails": video.videoDiscussion,
    },
    "exercises": exerciseCollection[]-> {
      "id": _id,
      "type": exerciseType,
      "title": title,
      "description": shortDescription,
      "cardImage": exerciseImage.mainImage.asset->url,
      "cardImageAltTag": exerciseImage.imageAltTag,
      "cardImageTitleTag": exerciseImage.imageTitleTag,
      "cardImageWidth": exerciseImage.imageWidth,
      "cardImageHeight": exerciseImage.imageHeight,
      "breakdown": description,
    }
  }
`;

const rapidRecoveryExerciseCardsQuery = `
  {
    "rapidRecoveryWeekData": *[
      _type == "collection" && 
      program -> programId == "rapid_recovery" && 
      _id == '27b932b6-12db-4907-82e8-d46b0d9dcbdd'] {
        "exercises": exerciseCollection[]-> {
          "id": _id,
          "type": exerciseType,
          "title": title,
          "description": shortDescription,
          "cardImage": exerciseImage.mainImage.asset->url,
          "cardImageAltTag": exerciseImage.imageAltTag,
          "cardImageTitleTag": exerciseImage.imageTitleTag,
          "cardImageWidth": exerciseImage.imageWidth,
          "cardImageHeight": exerciseImage.imageHeight,
        }
      }
  }
`;

const rapidRecoveryVideoAndWorkoutQuery = `
  {
    "rapidRecoveryWeekData": *[
      _type == "collection" && 
      program -> programId == "rapid_recovery" && 
      _id == '27b932b6-12db-4907-82e8-d46b0d9dcbdd'] {
        "videoSession": videoCollection[]-> {
          "id": _id,
          "order": video.order,
          "videoType": video.videoType,
          "videoHost": video.videoHost,
          "videoTitle": video.title,
          "videoId": video.videoId,
          "sessionWorkoutDetails": video.videoDiscussion,
        }
      }
  }
`;
