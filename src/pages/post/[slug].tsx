import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  id: string;
  last_publication_date: string | null;
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
  navigation: {
    prevPost: {
      uid: string,
      data: {
        title: string
      }
    }[],
    nextPost: {
      uid: string,
      data: {
        title: string
      }
    }[]
  }
}

export default function Post({ post, navigation }: PostProps) {
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
            <div>
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
            <p>
              {
                format(new Date(post.first_publication_date), "'* editado em' dd MMM yyyy', às' kk':'mm", {
                  locale: ptBR
                })
              }
            </p>
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
        <footer className={styles.footer}>
          {
            navigation.prevPost.length !== 0 && (
              <div className={styles.prevPost}>
                <p>{navigation.prevPost[0].data.title}</p>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  Post Anterior
                </Link>
              </div>
            )
          }

          {
            navigation.nextPost.length !== 0 && (
              <div className={styles.nextPost}>
                <p>{navigation.nextPost[0].data.title}</p>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  Próximo Post
                </Link>
              </div>
            )
          }
        </footer>

        <Comments />
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

  const prevPost = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    pageSize: 1,
    after: post.id,
    orderings: '[document.first_publication_date  desc]',
  });

  const nextPost = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    pageSize: 1,
    after: post.id,
    orderings: '[document.first_publication_date]',
  });

  return{
    props: { 
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results
      }
    }
  }
};
