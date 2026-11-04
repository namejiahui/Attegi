import { useParams } from "@solidjs/router";
import HomeFeed from "../../../components/HomeFeed";

export default function EnPagedHome() {
  const params = useParams<{ page: string }>();
  const pageNumber = () => Math.max(1, parseInt(params.page, 10) || 1);
  return <HomeFeed lang="en" page={pageNumber()} />;
}
