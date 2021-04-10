import { GetStaticProps } from 'next';

import Header from '../components/Header';
import {FiCalendar , FiUser} from 'react-icons/fi'

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

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

export default function Home({postsPagination}:HomeProps ) :JSX.Element {


  const formatPost = postsPagination.results.map( post => {
    return {
      
        uid:post.uid,
        first_publication_date: format( new Date( post.first_publication_date),'dd MMM yyyy', { locale : ptBR}  )  ,
        data: {
          title:post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
       
    }
  })

  const [ post , setPost] = useState<Post[]>(formatPost)

  const [nextPage , setnextPage] = useState(postsPagination.next_page)
  const [currentPage , setCurrentPage ] = useState(1)

 async function handleNextPage () : Promise<void> {
    if(currentPage != 1 &&  nextPage === null) {
      return
    }
    const postResult = await fetch(`${nextPage}`).then(response => response.json())
    
    setnextPage(postResult.next_page)
    setCurrentPage(postResult.page)

   const  newPost = postResult.results.map( (post) => {
     return {
      uid:post.uid,
      first_publication_date: format( new Date( post.first_publication_date),'dd MMM yyyy', { locale : ptBR}  )  ,
      data: {
        title:post.data.titulo,
        subtitle: post.data.subtitle,
        author: post.data.autor
      }
     }

    });
    
    setPost([...post, ...newPost ]);

  }


  return(
    <>
    <body className={commonStyles.container}>
      <main className={styles.content}>
        <section>
        <Header/>
          {post.map( (post) => {
          return (
            <Link href={`/post/${post.uid}`} key={post.uid}>
                <a className={styles.post}>
                <h1>{post.data.title}</h1>
                <h2>{post.data.subtitle}</h2>
                <div className={styles.footer} >
                  <div>
                    <FiCalendar/>
                    <h3>{post.first_publication_date}</h3>
                  </div>
                  <div>
                    <FiUser/>
                    <h3>{post.data.author}</h3>

                  </div>
                </div> 
          </a>
        </Link> 
          )
      })}
        
        {nextPage && (   
          <button type='button' className={styles.button} onClick={handleNextPage}>
            Carregar mais posts
          </button>
        ) }
        </section>
      </main>
    </body>
    </>
  )
}

export const getStaticProps :GetStaticProps = async () => {
   const prismic = getPrismicClient();
   const postsResponse = await prismic.query(
     Prismic.Predicates.at('document.type','posts'),{pageSize :1}
   );
   console.log(postsResponse.results)
   let posts = postsResponse.results.map( (post) => {
     return {
       uid:post.uid,
       first_publication_date: post.first_publication_date,
       data: {
         title:post.data.title,
         subtitle: post.data.subtitle,
         author: post.data.author
       }
     }
   })

  const newPosts = posts.map( (post) => {  
    return {
      ...post,
      first_publication_date:format( new Date( post.first_publication_date),'dd MMM yyyy', { locale : ptBR}  )
    }
  }) 
  

   const postsPagination = {
     next_page: postsResponse.next_page,
     results:posts
   }

   
    return {
      props: {
        postsPagination
      }
    }
};
