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
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNexPage] = useState(postsPagination.next_page);

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
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  });

  return{
    props: {
      postsPagination : {
        next_page: postsResponse.next_page,
        results: postsResponse.results
      }
    }
  }
};
 