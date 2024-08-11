export default function SearchBox({ value, onChange, onClear }) {
    const handleChange = (event) => {
      if (onChange) {
        onChange(event.target.value);
      }
    };
  
    return (
      <div>
        <input
          type="text"
          className="border border-gray-300 rounded-md px-3 py-2 mr-2 focus:outline-none focus:border-blue-800 "
          value={value}
          onChange={handleChange}
          placeholder="Search a movie here..."
        />

        <button
        type="button"
        className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        onClick={onClear}
            > Clear
        </button>
      </div>
    );
  };