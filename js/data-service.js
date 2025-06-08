/**
 * @module dataService
 * @description Handles fetching and caching data for the application.
 * This service ensures that data is fetched from the server only once
 * and subsequent requests receive the cached data.
 */
const dataService = (() => {
  // Use a private variable to cache the fetched data.
  // It's initialized to null to indicate that no data has been fetched yet.
  let taxDataCache = null;

  // This variable will hold the promise returned by the fetch call.
  // This prevents multiple network requests if getTaxRates is called
  // multiple times before the first request has completed.
  let fetchPromise = null;

  const API_ENDPOINT = '/api/tax-rates/2025';

  /**
   * Fetches the tax rate data from the server.
   * This function is designed to be called only once. It caches the result.
   * @returns {Promise<object>} A promise that resolves with the tax data.
   */
  const getTaxRates = () => {
    // If the cache is already populated, return it immediately,
    // wrapped in a resolved promise to maintain a consistent return type.
    if (taxDataCache) {
      return Promise.resolve(taxDataCache);
    }

    // If a fetch operation is already in progress, return the existing promise.
    // This prevents firing off a second network request.
    if (fetchPromise) {
      return fetchPromise;
    }

    // If there's no cached data and no request in flight, start a new one.
    fetchPromise = fetch(API_ENDPOINT)
      .then(response => {
        // Check if the HTTP response is successful (status code 200-299).
        if (!response.ok) {
          throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        // Parse the JSON body of the response.
        return response.json();
      })
      .then(data => {
        // Store the successfully fetched data in our cache.
        taxDataCache = data;
        // Return the data for the current promise chain.
        return taxDataCache;
      })
      .catch(error => {
        // Log the error to the console for debugging.
        console.error('Failed to fetch tax data:', error);
        // Reset the promise so that a future call can try again.
        fetchPromise = null;
        // Re-throw the error so that calling code can handle it.
        throw error;
      });

    return fetchPromise;
  };

  // Expose the public method(s) of the service.
  return {
    getTaxRates,
  };
})();
