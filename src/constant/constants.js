import { Platform } from "react-native";

export const BASE_URL = Platform.OS == 'ios' ?  'http://localhost:1001/api/'   : `http://10.0.2.2:1001/api/`;

export function formatDate(isoString) {
    const date = new Date(isoString);

    if (isNaN(date)) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

