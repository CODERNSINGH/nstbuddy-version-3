// src/services/sheetsApi.ts
import axios from 'axios';
import { Assignment } from '../types';

const SHEET_ID = '1si0x5py8An1QhGapLdoEnF-g84Wk2qNeEfFkELhpXJg';
const API_KEY = 'AIzaSyCuNpDisrzPeXJ5fkYdrshKgfX6dIgmlaA';

// Enum for available sheet names
export enum SheetName {
  DBMS_LAB = 'DBMS-Lab',
  DBMS = "DBMS",
  AP = "AP",
  AP_LAB = "AP-Lab",
  ADA = "ADA",
  ADA_LAB = "ADA-Lab",
  MathsIII = "MathsIII",
  MathsIII_Lab = "MathsIII-Lab",
  Streak_Question = "Streak_Question"
}

// Function to build the range string
const buildRange = (sheetName: string): string => {
  return `${sheetName}!A1:D`;
};

// Fetch assignments from a specific sheet
export const fetchAssignments = async (
  sheetName: string
): Promise<Assignment[]> => {
  const range = buildRange(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row: any[], i: number) => {
      const obj: any = {
        id: i + 1,
        date: new Date().toISOString().split("T")[0],
        sheetSource: sheetName, // Track which sheet this came from
      };

      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || '';
      });

      return obj;
    });

    return data;
  } catch (error) {
    return [];
  }
};

// Fetch assignments from multiple sheets and combine them
export const fetchAllAssignmentsSem2 = async (): Promise<Assignment[]> => {
  try {
    const sheetNames = Object.values(SheetName);
    const promises = sheetNames.map(sheet => fetchAssignments(sheet));
    const results = await Promise.all(promises);

    // Combine results from all sheets, giving each item a unique ID
    let allAssignments: Assignment[] = [];
    let idCounter = 1;

    results.forEach(assignments => {
      const assignmentsWithId = assignments.map(assignment => ({
        ...assignment,
        id: idCounter++
      }));
      allAssignments = [...allAssignments, ...assignmentsWithId];
    });

    return allAssignments;
  } catch (error) {
    return [];
  }
};

// Function to get sheets metadata (optional, for more advanced functionality)
export const fetchSheetsMetadata = async (): Promise<any> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    return response.data.sheets;
  } catch (error) {
    return [];
  }
};