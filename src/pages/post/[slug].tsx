import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import Prismic from '@prismicio/client' 
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { realpathSync } from 'node:fs';
import { useRouter } from 'next/router';
import  Head  from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


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

export default function Post({post} : PostProps) : JSX.Element {

  const totalpalavras = post.data.content.reduce( (total, contentItem ) => {
    total += contentItem.heading.split(' ').length;
    const words = contentItem.body.map( item => item.text.split(' ').length);
    words.map( word => (total += word))
    return total;
  },0)

  const readTime = Math.ceil(totalpalavras / 200)
  
  const router = useRouter()

  if(router.isFallback) {
    return <h1>Carregando...</h1>
  }
  const formatDate = format( new Date(post.first_publication_date),
  'dd MMM yyyy',
  {
    locale:ptBR
  }
  )

  return (
    <>
    <Head>
      <title>{`${post.data.title}`}</title>
    </Head>
      <main className={styles.container}>
        <Header/>
        <img src={post.data.banner.url} className={styles.banner} alt="imagem "/>
          <div className={styles.post}>
            <div>
                <h1>{post.data.title}</h1>
              <div className={styles.footer} >
                    <div>
                      <FiCalendar/>
                      <h3>{formatDate}</h3>
                    </div>
                    <div>
                      <FiUser/>
                      <h3>{post.data.author}</h3>
                    </div>
                    <div>
                      <FiClock/>
                    <h3>{`${readTime} min`}</h3>
                    </div>
              </div>
              {post.data.content.map( ( content) => {
                return (
                  <article key={content.heading}>
                  <h2>{content.heading} </h2>
                  <div 
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{__html: RichText.asHtml(content.body)}} 
                   />
  
                </article>
                )
              })}
             
              

            </div>
          </div>
      </main>
    </>
  )
}

export const getStaticPaths : GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),

  ]);
const paths = posts.results.map( post => {
  return  {
    params:{
      slug : post.uid,
    }
  }
})
  return {
    paths,
    fallback: true,// See the "fallback" section below
  };
};

export const getStaticProps : GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const {slug} = context.params;
  const response = await prismic.getByUID('posts', String(slug), {} );

  const post = {
    uid: response.uid,
    first_publication_date : response.first_publication_date,
    data:{
      title:response.data.title,
      subtitle:response.data.subtitle,
      author:response.data.author,
      banner:{
        url:response.data.banner.url,
      },
      content: response.data.content.map( content => {
        return {
          heading:content.heading,
          body:[...content.body],
        }
      }),
    }
  }

  return {
    props: {
      post,
    },
  }
};
