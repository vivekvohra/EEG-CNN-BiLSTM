export function isValidEegFile(file: File) {
  return file.name.endsWith(".set");
}