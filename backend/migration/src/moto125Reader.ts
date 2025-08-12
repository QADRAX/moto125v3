import axios from 'axios';
import * as cheerio from 'cheerio';
import { getAbsoluteUrl } from './htmlUtils';
import { BASE_URL } from './constants';

export async function getMoto125MainArticleImage(url: string): Promise<string> {
    try {
      const { data: html } = await axios.get(url);
      
      const $ = cheerio.load(html);
      
      const div = $('.flownews-posts-content-wrap.flownews-post-layout1');
      if (div.length > 0) {
        const style = div.attr('style');
        
        if (style) {
          const match = style.match(/background-image:url\((.*?)\)/);
          if (match && match[1]) {
            return getAbsoluteUrl(BASE_URL, match[1]);
          }
        }
      }
  
      throw new Error('Background image URL not found.');
    } catch (error) {
      throw new Error(`Error fetching HTML or parsing the content`);
    }
  }