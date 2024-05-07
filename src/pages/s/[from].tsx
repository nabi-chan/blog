import { GetServerSidePropsContext } from 'next';

const redirectMap = [
  {
    from: '2024-nextjs-starter',
    destination: 'https://2024-nextjs-starter.vercel.app',
  },
];

export default function Redirect() {
  return <>Redirecting...</>;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context;
  const { from } = params;

  const redirect = redirectMap.find((item) => item.from === from);

  if (redirect) {
    return {
      redirect: {
        destination: redirect.destination,
        permanent: false,
      },
    };
  }

  return {
    notFound: true,
  };
}
