export default function RemoveFavorites({ onClick }) {
    return (
      <button
        onClick={onClick}
        className="text-white bg-gray-700 hover:bg-gray-600 font-bold py-2 px-4 rounded"
      >
        ❌ Remove from Favorites
      </button>
    );
  }