export function applyFilter(context, filterType = "none") {
  switch (filterType) {
    case "greyscale":
      context.filter = "grayscale(100%)";
      break;
    case "contrast":
      context.filter = "contrast(200%)";
      break;
    default:
      context.filter = "none";
  }
}
