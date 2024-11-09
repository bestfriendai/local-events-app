// Update the handleSortChange function
const handleSortChange = () => {
  const newSortBy = currentSortBy === 'date' ? 'distance' : 'date';
  console.log('Changing sort to:', newSortBy);
  onFilterChange({ sortBy: newSortBy });
};