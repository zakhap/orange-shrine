// @ts-expect-error - are.na package doesn't have TypeScript declarations
import Arena from 'are.na';
import ExperimentalList from './components/ExperimentalList';

interface ArenaBlock {
  id: number;
  title: string;
  image?: {
    large: {
      url: string;
    };
  };
  content?: string;
  class: string;
  created_at: string;
  connections?: ArenaBlock[];
}

interface ArenaChannel {
  contents: ArenaBlock[];
}

async function getOrangePosts(): Promise<ArenaBlock[]> {
  try {
    const arena = new Arena();
    const channel = await arena.channel('orange-space').get({ per: 100 }) as ArenaChannel;
    
    // Filter for image blocks and sort by creation date (newest first)
    return channel.contents
      .filter(block => block.class === 'Image' && block.image)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching Are.na data:', error);
    return [];
  }
}

export default async function Home() {
  const posts = await getOrangePosts();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="text-center py-8 border-b-2 border-black">
        <h1 className="text-4xl font-bold font-mono">ORANGE SPACE</h1>
        <p className="text-lg mt-2 font-mono">A shrine to Orange the cat</p>
      </header>

      {/* Experimental List */}
      <main className="max-w-2xl mx-auto p-8">
        <ExperimentalList posts={posts} />

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl font-mono">No Orange photos found yet!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t-2 border-black mt-16">
        <p className="font-mono text-sm">
          Powered by{' '}
          <a href="https://are.na/orange-space" className="underline" target="_blank" rel="noopener noreferrer">
            Are.na
          </a>
        </p>
      </footer>
    </div>
  );
}


// Enable ISR - revalidate every hour
export const revalidate = 3600;