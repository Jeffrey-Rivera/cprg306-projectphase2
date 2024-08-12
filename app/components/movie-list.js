export default function MovieList({movies, handleFavoritesClick, FavoriteComponent}) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <div key={movie.imdbID} className="w-full"> 
            <div className="relative h-96">
              <img src={movie.Poster} alt={movie.Title} className="w-full h-full object-cover transition-transform duration-200 ease-in-out hover:scale-105 rounded-lg" />
              <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-70 p-2 text-white">
                <h3 className="font-semibold text-shadow">{movie.Title}</h3>
                {movie.Ratings?.length > 0 && 
                <p className="text-sm">⭐{movie.Ratings.find(r => r.Source === "Internet Movie Database")?.Value}</p>}
              </div>
            </div>
            
            <div className="text-sm pt-2 text-gray-400">
              <p>Type: {movie.Type}</p>
              <p>Genre: {movie.Genre}</p>
              <p>Year: {movie.Year}</p>
              <button onClick={() => handleFavoritesClick(movie)} className="mt-2">
                <FavoriteComponent />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }