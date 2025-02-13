
import { Link } from 'react-router-dom';
import { Navbar } from '../Navbar';

export const NotFoundView = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Link to="/articles" className="text-primary hover:text-primary-hover">
            Return to Articles
          </Link>
        </div>
      </main>
    </div>
  );
};
