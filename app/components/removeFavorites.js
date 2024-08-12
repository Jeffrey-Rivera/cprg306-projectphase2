export default function RemoveFavorites({ onClick }) {
    return (
      <button
        onClick={onClick}
        className="text-red-800 bg-gray-500 hover:bg-gray-200 font-bold py-2 px-4 rounded"
      >
        REMOVE MOVIE
      </button>
    );
  }