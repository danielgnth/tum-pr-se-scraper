import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('./pages/CourseList.tsx'),
  route('courses/:id', './pages/CourseDetail.tsx'),
] satisfies RouteConfig
