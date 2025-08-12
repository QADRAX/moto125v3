import { Post } from "./types";

interface PostsByYear {
    [year: number]: Post[];
}

/**
 * Agrupa los posts por año de publicación.
 * @param posts - El array de posts a agrupar.
 * @returns Un objeto donde cada clave es un año y el valor es un array de posts de ese año.
 */
export function getPostsByYear(posts: Post[]): PostsByYear {
    return posts.reduce((acc: PostsByYear, post: Post) => {
        const year = post.publicationDate.getFullYear();
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(post);
        return acc;
    }, {});
}

