# docs
professional docs

## Performance Optimization Notes

* **Image Handling:** Uploaded logos are scaled down in the browser to a maximum of about 300 px on either side and exported with slight PNG compression (quality ≈ 0.7). This keeps the base64 Data URL small so the draft JSON stays under the ∼4 MB LocalStorage limit.
* **Lazy Loading:** Should large images be added to informational pages (e.g. `about_buelldocs.html`), add `loading="lazy"` on the `<img>` tags to defer loading until they are in view.
* **Code Splitting:** For future enhancements with heavier JavaScript, dynamic imports such as `import('./module.js').then(...)` can be used to load modules only when necessary. This requires switching the main script to an ES module.
