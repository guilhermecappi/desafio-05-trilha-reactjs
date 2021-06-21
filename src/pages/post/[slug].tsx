import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  if(isFallback){
    return(
      <div>Carregando...</div>
    )
  }

  const wordArray = post.data.content.reduce((accumulator, item) => {
    const totalContentWords = RichText.asText(item.body).split(' ').length

    return accumulator + totalContentWords
  }, 0);
  
  const timeToRead = Math.ceil(wordArray / 200);

  return(
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <div className={styles.imageContainer}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
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
            <span><FiClock /> {timeToRead} min</span>
          </div>
          {
            post.data.content.map(content => (
              <div key={post.data.title} className={styles.postContent}>
                <h2>{content.heading}</h2>
                {
                  content.body.map(body => (
                    <div key={body.text.substring(0, 10)} dangerouslySetInnerHTML={{__html: body.text}}/>
                  ))
                }
              </div>
            ))
          }
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { 
      fetch: ['post.title', 'post.banner', 'post.author', 'post.content'],
    }
  );

  const paths = posts?.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  });

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const post: Post = await prismic.getByUID('posts', String(slug), {});

  return{
    props: { post }
  }
};
