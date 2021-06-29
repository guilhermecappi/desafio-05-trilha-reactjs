import { GetStaticProps } from 'next';
import { useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';


import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { FiUser, FiCalendar } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState(postPagination.results);
  const [nextPage, setNexPage] = useState(postPagination.next_page);

  async function loadMorePosts(){
    const response = await fetch(nextPage);
    const data = await response.json();

    const loadedPosts = data.results

    setPosts([...posts, ...loadedPosts])
    setNexPage(data.next_page)
  }

  return(
    <>
      <Head>
        <title>Início | spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        {
          posts.map( post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <div className={styles.post}> 
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <span>
                    <FiCalendar /> 
                      {
                      format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                        locale: ptBR
                      })
                      }
                  </span>
                  <span><FiUser /> {post.data.author}</span>
                </div>
              </div>
            </Link>
          ))
        }
        {
          nextPage && ( 
            <p 
            onClick={loadMorePosts}
            className={styles.loadMore}
            >
              Carregar mais posts
            </p>
          )
        }
        
        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({preview = false, previewData}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
    ref: previewData?.ref ?? null,
  });

  return{
    props: {
      postPagination : {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
        preview
      }
    }
  }
};
 