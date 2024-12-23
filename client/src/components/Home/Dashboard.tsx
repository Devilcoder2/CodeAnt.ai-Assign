/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ArrowPathIcon,
    CircleStackIcon,
    MagnifyingGlassIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { SyncLoader } from 'react-spinners';
import { dateFormatter } from '../../helper.ts';
import { RootState } from '../../redux/store.ts';

interface Repository {
    archived: string;
    clone_url: string;
    contributors_url: string;
    created_at: string;
    updated_at: string;
    default_branch: string;
    forks_count: string;
    forks_url: string;
    name: string;
    id: string;
    language: string;
    languages_url: string;
    open_issues_count: string;
    owner: { login: string; url: string };
    private: string;
    size: string;
    ssh_url: string;
    visibility: string;
}

const Dashboard = () => {
    const [filterdData, setFilterdData] = useState<Repository[]>([]);
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const { page } = useOutletContext<{ page: number }>();
    const [isLastPage, setIsLastPage] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState<boolean>(false);

    const navigate = useNavigate();

    useHotkeys('alt+s', () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    });

    const isRepoSizeVisible = useSelector(
        (state: RootState) => state.isRepoSizeVisible
    );

    const isTagsVisible = useSelector(
        (state: RootState) => state.isTagsVisible
    );

    const sortingOrder = useSelector((store: RootState) => store.sortingOrder);
    const isDarkModeOn = useSelector((store: RootState) => store.isDarkModeOn);

    useEffect(() => {
        const sortedData = [...repos];

        switch (sortingOrder) {
            case 0:
                sortedData.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 1:
                sortedData.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
                break;
            case 2:
                sortedData.sort(
                    (a, b) =>
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                );
                break;
            default:
                break;
        }

        setFilterdData(sortedData);
    }, [sortingOrder, repos]);

    const handleFilter = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const filtered = repos.filter(
            (item) =>
                item.name.toLowerCase().includes(value.toLowerCase()) ||
                item?.visibility
                    ?.toLowerCase()
                    ?.includes(value.toLowerCase()) ||
                item?.language?.toLowerCase()?.includes(value.toLowerCase())
        );
        setFilterdData(filtered);
    };

    const fetchRepositories = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/fetch-repos?page=${page}`,
                {
                    headers: {
                        Authorization: `${localStorage.getItem('accessToken')}`,
                    },
                }
            );

            const data = await response.json();
            console.log(data);
            if (data.length === 0) {
                setIsLastPage(true);
                setIsFetching(false);
                return;
            }
            const filteredPropertiesRepo = data?.map((item: any) => {
                if (item.language === null) item.language = 'Unknown';
                return {
                    archived: item.archived,
                    clone_url: item.clone_url,
                    contributors_url: item.contributors_url,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    default_branch: item.default_branch,
                    forks_count: item.forks_count,
                    forks_url: item.forks_url,
                    name: item.name,
                    id: item.id,
                    language: item.language,
                    languages_url: item.languages_url,
                    open_issues_count: item.open_issues_count,
                    owner: { login: item.owner.login, url: item.owner.url },
                    private: item.private,
                    size: item.size,
                    ssh_url: item.ssh_url,
                    visibility: item.visibility,
                };
            });

            if (response.status !== 401) {
                setRepos((prev) => [...prev, ...filteredPropertiesRepo]);
                setFilterdData((prev) => [...prev, ...filteredPropertiesRepo]);
            } else {
                console.error(data.error);
            }
            setLoadingData(false);
        } catch (error) {
            console.error('Error fetching repositories:', error);
            alert('Failed to fetch repositories.');
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (!isLastPage) {
            if (!loadingData) setIsFetching(true);
            fetchRepositories();
        }
    }, [page]);

    const refreshAllHandler = () => {
        setLoadingData(true);
        fetchRepositories();
    };

    const addRepoHandler = () => {
        navigate('/add-repo');
    };

    return (
        <div className={`${isDarkModeOn ? 'dark' : ''}`}>
            <div className={`p-2 scrollbar-hide dark:bg-[#171717]`}>
                <div
                    className={`bg-white dark:bg-[#212121] dark:text-[#ECECEC] w-full rounded-xl border dark:border-[rgb(47,47,47)] flex flex-col`}
                >
                    <div
                        className={`flex flex-col gap-4 border-b dark:border-[rgb(47,47,47)] p-4`}
                    >
                        <div
                            className={`flex justify-between items-center flex-wrap gap-4`}
                        >
                            <div className={`flex flex-col`}>
                                <span className={`font-semibold text-xl`}>
                                    Repositories
                                </span>
                                <span
                                    className={`font-light text-sm dark:text-[#ECECEC]`}
                                >
                                    {filterdData.length} total repositories
                                </span>
                            </div>
                            <div className={`flex gap-2`}>
                                <button
                                    onClick={refreshAllHandler}
                                    className={`flex text-xs items-center p-2 px-4 gap-2 rounded-md border dark:border-[rgb(47,47,47)] dark:text-[#ECECEC] hover:bg-gray-100 dark:hover:bg-[rgb(47,47,47)]`}
                                >
                                    <ArrowPathIcon className={`size-4`} />
                                    Refresh All
                                </button>
                                <button
                                    onClick={addRepoHandler}
                                    className={`flex text-xs items-center p-2 px-4 gap-2 bg-[#1570EF] dark:bg-[#383838] text-white rounded-md hover:bg-[#1570efde] dark:hover:bg-[#171717]`}
                                >
                                    <PlusIcon className={`size-4`} />
                                    Add Repository
                                </button>
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor={`inputSearch`}
                                className={`border dark:border-[rgb(47,47,47)] w-fit rounded-md flex gap-2 items-center px-2 py-2 dark:bg-[#212121]`}
                            >
                                <MagnifyingGlassIcon
                                    className={`size-4 stroke-2 dark:stroke-[#ECECEC]`}
                                />
                                <input
                                    id={`inputSearch`}
                                    ref={inputRef}
                                    placeholder={`Search Repositories`}
                                    onChange={handleFilter}
                                    className={`text-xs w-[200px] placeholder:text-gray-700 dark:placeholder:text-[#ECECEC] outline-none dark:bg-[#212121] dark:text-[#ECECEC]`}
                                />
                            </label>
                        </div>
                    </div>

                    {!loadingData && (
                        <div className={`flex flex-col w-full`}>
                            {filterdData.length >= 1 ? (
                                filterdData.map((item, index) => {
                                    return (
                                        <div
                                            key={index}
                                            onClick={() =>
                                                navigate(
                                                    '/repo-details/' + item.id
                                                )
                                            }
                                            className={`flex flex-col p-4 gap-3 hover:bg-gray-100 dark:hover:bg-[rgb(47,47,47)] ${
                                                index !== filterdData.length - 1
                                                    ? 'border-b dark:border-[rgb(47,47,47)]'
                                                    : ''
                                            }`}
                                        >
                                            <div
                                                className={`flex gap-2 items-center`}
                                            >
                                                <span>{item.name}</span>
                                                {isTagsVisible && (
                                                    <span
                                                        className={`bg-[#EFF8FF] border-[#B2DDFF]  dark:bg-[#383838] text-[#1570EF] dark:text-white border  dark:border-[rgb(47,47,47)] text-xs px-2 rounded-full`}
                                                    >
                                                        {item.visibility}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className={`flex gap-4 md:gap-8 text-sm font-light dark:text-[#ECECEC]`}
                                            >
                                                <span
                                                    className={`flex items-center gap-2`}
                                                >
                                                    {item.language || 'Unknown'}
                                                    <span
                                                        className={`bg-[#1570EF] dark:bg-[#ECECEC] p-1 rounded-full`}
                                                    ></span>
                                                </span>
                                                {isRepoSizeVisible && (
                                                    <span
                                                        className={`flex items-center gap-2`}
                                                    >
                                                        <CircleStackIcon
                                                            className={`w-4`}
                                                        />
                                                        {item.size} KB
                                                    </span>
                                                )}
                                                <span>
                                                    Updated{' '}
                                                    {dateFormatter(
                                                        item.updated_at
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div
                                    className={`flex flex-col border-b dark:border-[rgb(47,47,47)] p-4 gap-3 text-gray-500 dark:text-[#ECECEC] text-center`}
                                >
                                    Looks like there is no repository to show.
                                </div>
                            )}
                        </div>
                    )}

                    {loadingData && (
                        <div className='flex justify-center items-center h-96'>
                            <SyncLoader
                                color={`${
                                    isDarkModeOn ? '#ECECEC' : '#1570EF'
                                }`}
                            />
                        </div>
                    )}

                    {isFetching && (
                        <div className='flex justify-center items-center h-24'>
                            <SyncLoader
                                color={`${
                                    isDarkModeOn ? '#ECECEC' : '#1570EF'
                                }`}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
