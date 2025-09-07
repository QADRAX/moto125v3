import { RSSItemCategory } from "./types";

export function isRSSItemCategoryArray(obj: any): obj is RSSItemCategory[] {
    if(obj.forEach) {
        return true;
    }
    return false;
}