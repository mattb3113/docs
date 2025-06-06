# docs
professional docs

## Performance Optimization Notes

* **Image Handling:** If large images are uploaded as logos, they are resized on the client before being converted to a Data URL. When saving drafts, the code checks that the resulting JSON is under roughly 4 MB so LocalStorage does not overflow.
* **Lazy Loading:** Should large images be added to informational pages (e.g. `about_buelldocs.html`), add `loading="lazy"` on the `<img>` tags to defer loading until they are in view.
* **Code Splitting:** For future enhancements with heavier JavaScript, dynamic imports such as `import('./module.js').then(...)` can be used to load modules only when necessary. This requires switching the main script to an ES module.
