"use client";

import { useState, useEffect } from 'react';
import AddFavorites from './components/addFavorites';
import MovieList from './components/movie-list';
import MovieListHeading from './components/movieListHeading';
import RemoveFavorites from './components/removeFavorites';
import SearchBox from './components/search-box';

const API_KEY = 'd74b16e8'; 

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function Alert({ message, isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-4">
      {message}
      <button onClick={onClose} className="absolute top-1 right-2 text-xl">&times;</button>
    </div>
  );
}

export default function Page() {
  const [movies, setMovies] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');


  useEffect(() => {
    const getMovieRequest = async () => {
      if (!debouncedSearchValue) {
        setMovies([]);
        setErrorMessage('');
        return;
      }
      const url = `https://www.omdbapi.com/?s=${encodeURIComponent(debouncedSearchValue)}&apikey=${API_KEY}`;
      setIsLoading(true); 

      try {
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const responseJson = await response.json();

        setIsLoading(false); 
        if (responseJson.Search) {
          const moviesWithDetails = await Promise.all(
            responseJson.Search.map(async (movie) => {
              const detailsUrl = `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsJson = await detailsResponse.json();
              return { ...movie, Genre: detailsJson.Genre, Ratings: detailsJson.Ratings };
            })
          );
          setMovies(moviesWithDetails);
          setErrorMessage('');
        } else {
          setMovies([]);
          setErrorMessage('Movie not found!');
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        setIsLoading(false); 
        setErrorMessage('Failed to fetch movies. Please try again later.');
        setMovies([]);
      }
    };

    getMovieRequest();
  }, [debouncedSearchValue]);
  
  useEffect(() => {
    const movieFavorites = localStorage.getItem('react-movie-app-favorites');
    setFavorites(movieFavorites ? JSON.parse(movieFavorites) : []);
  }, []);

  const saveToLocalStorage = (items) => {
    localStorage.setItem('react-movie-app-favorites', JSON.stringify(items));
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setErrorMessage('');
  };

  const addFavoriteMovie = (movie) => {
    const newFavoriteList = [...favorites, movie];
    setFavorites(newFavoriteList);
    saveToLocalStorage(newFavoriteList);
    setAlertMessage(`${movie.Title} added to favorites!`);
    setIsAlertVisible(true);
    setTimeout(() => setIsAlertVisible(false), 3000); 
  };

  const removeFavoriteMovie = (movie) => {
    const newFavoriteList = favorites.filter((favorite) => favorite.imdbID !== movie.imdbID);
    setFavorites(newFavoriteList);
    saveToLocalStorage(newFavoriteList);
    setAlertMessage(`${movie.Title} removed from favorites.`);
    setIsAlertVisible(true);
    setTimeout(() => setIsAlertVisible(false), 3000); 
  };

  const clearFavorites = () => {
    const confirmClear = window.confirm("Are you sure you want to clear all favorites?");
    if (confirmClear) {
      setFavorites([]);
      localStorage.setItem('react-movie-app-favorites', JSON.stringify([]));
    }
  };

  return (
    <main className="bg-gray-900 p-2">
      
      <div className="mb-9">
        <MovieListHeading heading="Movie Gallery" />
        <p className="text-center text-white">Welcome to Movie Gallery!</p>
        <p className="text-center text-white">Search and Save...</p>
        <div className="flex flex-col items-center justify-center mt-6">
            <SearchBox value={searchValue} onChange={setSearchValue} onClear={handleClearSearch} />
            {isLoading && <p className="text-white">Loading...</p>}
            {errorMessage && <p className="text-red-600">{errorMessage}</p>}
        </div>
      </div>
      <div>
        <MovieList
          movies={movies}
          handleFavoritesClick={addFavoriteMovie}
          FavoriteComponent={AddFavorites}/>
      </div>
      
      <div>
        <MovieListHeading heading="Favorites" />
      </div>

      <div>
        <MovieList
          movies={favorites}
          handleFavoritesClick={removeFavoriteMovie}
          FavoriteComponent={RemoveFavorites}/>
      </div>

      <div>
      <button 
          onClick={clearFavorites} 
          className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out my-4">
          Clear List
        </button>
      </div>
      
      <Alert 
        message={alertMessage} 
        isVisible={isAlertVisible} 
        onClose={() => setIsAlertVisible(false)} 
      />
    </main>
  );
}