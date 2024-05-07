import { GetServerSidePropsContext } from 'next';

const redirectMap = [
  {
    from: '2024-nextjs-starter',
    destination: 'https://2024-nextjs-starter.vercel.app',
  },
  {
    from: '2024-nextjs-starter-slido',
    destination: 'https://app.sli.do/event/uZC3BK7nB7A1fvB7cK84nb',
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
