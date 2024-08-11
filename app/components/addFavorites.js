export default function AddFavorites({ onClick }) {
    return (
      <button
        onClick={onClick}
        className="text-white 'center' bg-gray-700 hover:bg-gray-400 font-bold py-2 px-4 rounded"
      >
        Add to Favorites
      </button>
    );
  }
   