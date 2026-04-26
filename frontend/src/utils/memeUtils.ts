export const getGameOverMeme = (score: number, total: number) => {
  const ratio = score / total;
  if (ratio === 1) return ["vikrammeme.jpg", "vakeelmeme.jpg"][Math.floor(Math.random() * 2)];
  if (ratio >= 0.7) return ["nirulsahameme.jpg", "answermeme.jpg", "edamonememe.jpg", "chandumeme.jpg", "pulimeme.jpg"][Math.floor(Math.random() * 5)];
  return ["sensememe.jpg", "pattumalsarammeme.jpg", "trappedmeme.jpg", "pavanayimeme.jpg"][Math.floor(Math.random() * 4)];
};
