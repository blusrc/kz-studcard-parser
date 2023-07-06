import { readFileSync, writeFileSync } from "fs";
import PDFParser from "pdf-parse";

// Change this to your Student Card Path
const pathToStudentCard = "./StudentCard.pdf";

interface StudInfoProps {
  unmodified: boolean;
  fullName: string;
  uniKk: string;
  uniRu: string;
  courseStart: Date;
  gradYear: number;
}

interface PDFMetadata {
  PDFFormatVersion: string;
  IsAcroFormPresent: boolean;
  IsXFAPresent: boolean;
  Producer: string;
  CreationDate: string;
  ModDate: string;
}

async function readPdfFile(filePath: string): Promise<void> {
  try {
    // Read the PDF file
    const dataBuffer = readFileSync(filePath);

    // Parse the PDF data
    const pdfData = await PDFParser(dataBuffer);

    // Extract metadata
    const { info } = pdfData;

    // Extract content
    const content = pdfData.text;

    const res = processStudentInfo(info, content);

    console.log(res);

    writeToTxtFile(filePath, info, content);
  } catch (error) {
    console.error("Error reading PDF file:", error);
    throw error;
  }
}

async function writeToTxtFile(
  filePath: string,
  info: PDFMetadata,
  content: string
): Promise<void> {
  // Generate the output file path
  const trimmedFilePath = filePath.replace(/\.[^.]+$/, ""); // Remove the file extension
  const outputFilePath = `${trimmedFilePath}_output.txt`; // Append "_output.txt"
  // Prepare the data to write into the output file
  const metaText = `Metadata:\n${JSON.stringify(info, undefined, 2)}`;
  const parsedText = `Parsed unmodified content:\n${content}`;
  const outputData = `${metaText}\n\n${parsedText}`;

  // Write the data into the output file
  writeFileSync(outputFilePath, outputData);

  console.log(`Data successfully written to ${outputFilePath}`);
}

function convertToDate(dateString: string): Date {
  const parts = dateString.split(".");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months in JavaScript are zero-based (0-11)
  const year = parseInt(parts[2], 10);

  return new Date(year, month, day);
}

function processStudentInfo(info: PDFMetadata, content: string): StudInfoProps {
  const unmod = info.CreationDate === info.ModDate;
  const lines = content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const fullName = lines[0] + " " + lines[1];
  const universityName = lines[3];
  const universityNameRussian = lines[4];
  const courseStartDate = convertToDate(lines[lines.length - 1]); // Convert string to Date object
  const gradYear = courseStartDate.getFullYear() + 4;

  return {
    unmodified: unmod,
    fullName: fullName,
    uniKk: universityName,
    uniRu: universityNameRussian,
    courseStart: courseStartDate,
    gradYear: gradYear,
  };
}

// Usage example
readPdfFile(pathToStudentCard).catch((error) => {
  console.log(error);
});
